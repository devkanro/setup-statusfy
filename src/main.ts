import * as core from '@actions/core'
import * as github from '@actions/github'
import {currentRepo} from './utils'
import {loadStatusfy} from './statusfy'
import {generateIncident, setupLabels} from './setup'
import simpleGit, {CommitResult, PushResult, StatusResult} from 'simple-git'

async function run(): Promise<void> {
  let octokit = github.getOctokit(core.getInput('github-token'))
  let statusfy = await loadStatusfy()

  let {data: labels} = await octokit.issues.listLabelsForRepo({
    ...currentRepo(),
    per_page: 100
  })
  let labelNames = labels.map(it => it.name)

  core.startGroup('🏷️ Initializing labels of repository...')
  await setupLabels(statusfy, octokit, labelNames)
  core.endGroup()

  if (github.context.issue.number) {
    core.startGroup(
      `✏️ Generating incident from #${github.context.issue.number}...`
    )
    await generateIncident(statusfy, octokit, github.context.issue.number)
    core.endGroup()

    let git = simpleGit()
    await git.add('.')
    let status: StatusResult = await git.status()
    if (status.isClean()) {
      core.info(':ok_hand: No content update.')
    } else {
      let user = core.getInput('git-user')
        ? core.getInput('git-user')
        : github.context.actor
      let email = core.getInput('git-email')
        ? core.getInput('git-email')
        : `${github.context.actor}@users.noreply.github.com`

      core.startGroup(`🍴 Create commit by '${user} <${email}>'.`)
      git.addConfig('user.name', user)
      git.addConfig('user.email', email)
      let commitResult: CommitResult = await git.commit(
        `:memo: Update incident by #${github.context.issue.number} update`
      )
      core.info(`Commit '${commitResult.commit}' created.`)
      let branch = `HEAD:refs/heads/${core.getInput('branch')}`
      let remote = `https://${github.context.actor}:${core.getInput(
        'github-token'
      )}@github.com/${github.context.repo.owner}/${
        github.context.repo.repo
      }.git`
      core.info(`Push '${commitResult.commit}' to '${branch}' on '${remote}'.`)
      let pushResult: PushResult = await git.push(remote, branch)
      core.info(`Commit '${commitResult.commit}' pushed to ${pushResult.ref}.`)
      core.endGroup()
      core.info(':ok_hand: Incident updated.')
    }
  } else {
    core.info(':ghost: No issue update.')
  }
}

run().catch(error => {
  core.setFailed(error)
})
