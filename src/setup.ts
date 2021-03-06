import * as core from '@actions/core'
import {GitHub} from '@actions/github/lib/utils'
import {acceptedAssociation, currentRepo} from './utils'
import {Incident, IncidentUpdate, Statusfy} from './statusfy'
import * as fs from 'fs'
import yaml from 'js-yaml'
import * as path from 'path'
import matter from 'gray-matter'

export async function setupLabels(
  statusfy: Statusfy,
  octokit: InstanceType<typeof GitHub>,
  existLabels: string[]
) {
  for (const severity of statusfy.severity) {
    let label = `severity: ${severity.name}`
    if (existLabels.indexOf(label) == -1) {
      octokit.issues.createLabel({
        ...currentRepo(),
        name: label,
        description: severity.description,
        color: severity.color
      })
      core.info(`Label '${label}' created.`)
    }
  }

  for (const locale of statusfy.locales) {
    let label = `locale: ${locale.code}`
    if (existLabels.indexOf(label) == -1) {
      octokit.issues.createLabel({
        ...currentRepo(),
        name: label,
        description: locale.iso,
        color: 'C5DEF5'
      })
      core.info(`Label '${label}' created.`)
    }
  }

  for (const system of statusfy.systems) {
    let label = `system: ${system.id}`
    if (existLabels.indexOf(label) == -1) {
      octokit.issues.createLabel({
        ...currentRepo(),
        name: label,
        description: system.description,
        color: '5319E7'
      })
      core.info(`Label '${label}' created.`)
    }
  }
}

export async function generateIncident(
  statusfy: Statusfy,
  octokit: InstanceType<typeof GitHub>,
  issue_number: number
) {
  let {data: issue} = await octokit.issues.get({
    ...currentRepo(),
    issue_number: issue_number
  })

  if (!acceptedAssociation(issue.author_association)) {
    core.info(
      `Permission decline, author of issue must be 'COLLABORATOR', 'MEMBER' or 'OWNER'.`
    )
    return
  }
  let labels = issue.labels.map(label =>
    typeof label === 'string' ? label : label.name
  )
  let severity:
    | 'under-maintenance'
    | 'major-outage'
    | 'partial-outage'
    | 'degraded-performance'
    | undefined
  let systems: string[] = []
  let locale: string | undefined

  core.info(`Label '${labels.join(', ')}' detected.`)

  for (let label of labels) {
    if (!label) continue

    if (label.startsWith('severity: ')) {
      let severityTag = label.substr('severity: '.length)
      switch (severityTag) {
        case 'under-maintenance':
          severity = 'under-maintenance'
          break
        case 'major-outage':
          severity = 'major-outage'
          break
        case 'partial-outage':
          severity = 'partial-outage'
          break
        case 'degraded-performance':
          severity = 'degraded-performance'
          break
      }
    }

    if (label.startsWith('system: ')) {
      systems.push(label.substr('system: '.length))
    }

    if (label.startsWith('locale: ')) {
      locale = label.substr('locale: '.length)
    }
  }
  if (!severity) {
    core.info(`No severity label detect for #${issue_number}.`)
    return
  }

  let issueMd = matter(issue.body ?? '')

  let incident: Incident = {
    title: issue.title,
    description: issueMd.content,
    date: issue.created_at,
    modified: issue.updated_at,
    resolved: !!issue.closed_at,
    severity: severity,
    affectedsystems: systems,
    ...issueMd.data
  }
  let updates: IncidentUpdate[] = []

  let page = 1
  while (true) {
    let {data: comments} = await octokit.issues.listComments({
      ...currentRepo(),
      issue_number: issue_number,
      page: page,
      per_page: 100
    })
    page++

    for (const comment of comments) {
      if (!acceptedAssociation(comment.author_association)) continue

      if (!comment.body) continue

      let commentMd = matter(comment.body)
      let body = commentMd.content.split('\n')
      if (body.length > 1 && body[0].startsWith('#')) {
        updates.push({
          title: body[0].substr(1).trim(),
          description: body.slice(1).join('\n'),
          date: comment.updated_at,
          ...commentMd.data
        })
      }
    }

    if (comments.length < 100) {
      break
    }
  }

  let result: string = ''

  result += '---yaml\n'
  result += yaml.dump(incident)
  result += '---\n'

  result += issueMd.content
  result += '\n\n'

  for (let update of updates) {
    result += `::: update ${update.title} | ${update.date}\n`
    result += update.description
    result += `\n:::\n\n`
  }

  let filePath: string[] = ['.']
  if (statusfy.content.dir) {
    filePath.push(statusfy.content.dir)
  } else {
    filePath.push('content')
  }

  if (locale && locale != statusfy.defaultLocale) {
    filePath.push(locale)
  }
  filePath.push(`${issue.created_at.substr(0, 10)}_issue-${issue_number}.md`)

  core.info(`Write incident file to '${path.join(...filePath)}'.`)
  await fs.promises.writeFile(path.join(...filePath), result)
}
