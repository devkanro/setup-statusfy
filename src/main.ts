import * as core from '@actions/core'
import * as github from '@actions/github'
import {currentRepo} from './utils'
import {loadStatusfy} from './statusfy'
import {generateIncident, setupLabels} from './setup'
import simpleGit, {StatusResult} from 'simple-git'

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
      await git.commit(
        `Update incident by #${github.context.issue.number} update`
      )
      await git.push('origin')
      core.info(':ok_hand: Incident updated.')
    }
  } else {
    core.info(':ghost: No issue update.')
  }
}

run().catch(error => {
  core.setFailed(error)
})
