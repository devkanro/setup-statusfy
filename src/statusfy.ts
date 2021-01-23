import fs from 'fs'
import yaml from 'js-yaml'
import toml from '@iarna/toml'

export interface Statusfy {
  locales: {
    code: string
    iso: string
    name: string
  }[]
  defaultLocale: string
  content: {
    dir: string
    frontMatterFormat: 'yaml' | 'yml' | 'toml' | 'json'
  }
  systems: {
    id: string
    title: string
    description: string
  }[]
  severity: {
    name: string
    description: string
    color: string
  }[]
}

export interface Incident {
  title: string
  description?: string
  date: string
  modified?: string
  severity:
    | 'under-maintenance'
    | 'major-outage'
    | 'partial-outage'
    | 'degraded-performance'
  affectedsystems: string[]
  resolved: boolean
  scheduled?: string
  duration?: string
}

export interface IncidentUpdate {
  title: string
  description?: string
  date: string
}

export async function loadStatusfy(): Promise<Statusfy> {
  let config = await loadConfig()
  let locale = await loadLocale(config)

  return {
    locales: config.locales,
    defaultLocale: config.defaultLocale,
    content: {
      dir: config.content.dir,
      frontMatterFormat: config.content.frontMatterFormat
    },
    systems: config.content.systems.map((it: string) => {
      return {
        id: it,
        title: locale.systems.items[it].title,
        description: locale.systems.items[it].description
      }
    }),
    severity: [
      {
        name: 'under-maintenance',
        description:
          'The system(s) cannot handle requests due to a temporary maintenance update.',
        color: '000000'
      },
      {
        name: 'major-outage',
        description:
          'No one can access the system(s) because it is completely down.',
        color: 'B60205'
      },
      {
        name: 'partial-outage',
        description:
          "Limited access to the system(s), because it's probably experiencing difficulties.",
        color: 'D93F0B'
      },
      {
        name: 'degraded-performance',
        description:
          "The system(s) is not stable, it's working slow otherwise impacted in a minor way.",
        color: 'FBCA04'
      }
    ]
  }
}

async function loadConfig() {
  if (fs.existsSync('./config.js')) {
    return require('./config.js')
  }

  if (fs.existsSync('./config.yaml')) {
    let config = await fs.promises.readFile('./config.yaml', 'utf8')
    return yaml.load(config)
  }

  if (fs.existsSync('./config.yml')) {
    let config = await fs.promises.readFile('./config.yml', 'utf8')
    return yaml.load(config)
  }

  if (fs.existsSync('./config.toml')) {
   let config = await fs.promises.readFile('./config.toml', 'utf8')
   return toml.parse(config)
  }

  throw Error('Config not found')
}

async function loadLocale(config: any): Promise<any> {
  let defaultLocale = config.locales.find((it: any) => {
    return it.code == config.defaultLocale
  })

  if (!defaultLocale)
    return {
      links: {}
    }

  let locale = `./locals/${defaultLocale.code}.json`
  if (fs.existsSync(locale)) {
    let config = await fs.promises.readFile(locale, 'utf8')
    return JSON.parse(config)
  }
  return {}
}
