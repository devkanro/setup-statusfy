# setup-statusfy
Manage your statusfy page by GitHub issues and actions

## Usage

See [action.yml](action.yml)

```yaml
steps:
- uses: actions/checkout@v1
- name: Generate incident
  uses: devkanro/setup-statusfy@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    branch: master
```

## Demo

See [The demo repository](https://github.com/devkanro/setup-statusfy-demo)
See [The demo site](http://statusfy.higan.me)

## Features
1. Manage labels of repository automatically.  
    This action will auto generate labels for your statusfy repository.
2. Manage your incidents by GitHub issues.  
    Use GitHub as GUI for editing statusfy pages.

## Quick Start

1. Create a folder
```shell
> mkdir my-statusfy
```

2. Initialize statusfy
```shell
> npx statusfy init
```

3. NPM install
```shell
> npm install
```

4. Add **setup-statusfy** Action  
    Create `.github/workflows/statusfy.yml`
```yaml
name: "Statusfy Incident"
on:
  issue_comment:
  issues:
    types: [opened, edited, closed, reopened]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - name: Generate incident
      uses: devkanro/setup-statusfy@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        branch: master
```

5. Add **deploy** Action  
    Create `.github/workflows/deploy.yml`
```yaml
name: "Deploy Statusfy"
on:
  push:
    branches: ["master"]

jobs:
  github-pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build the static site.
        run: |
          npm install
          npm run generate
      - name: Publish the static site to GitHub Pages.
        uses: jamesives/github-pages-deploy-action@releases/v3
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          BRANCH: gh-pages
          FOLDER: dist
```
