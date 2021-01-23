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

  core.startGroup(':label: Initializing labels of repository...')
  await setupLabels(statusfy, octokit, labelNames)
  core.endGroup()

  if (github.context.issue.number) {
    core.startGroup(
      `:pencil2: Generating incident from #${github.context.issue.number}...`
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
      let name = `${user} <${email}>`

      core.startGroup(`:fork_and_knife: Create commit by '${name}'.`)
      let commitResult: CommitResult = await git.commit(
        `Update incident by #${github.context.issue.number} update`,
        {
          '--author': `"${name}"`
        }
      )
      core.info(`Commit '${commitResult.commit}' created.`)
      let pushResult: PushResult = await git.push('origin')
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
