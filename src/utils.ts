import * as github from '@actions/github'

export function currentRepo() {
  return {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
  }
}

export function acceptedAssociation(userAssociation: string): boolean {
  switch (userAssociation) {
    case 'COLLABORATOR':
    case 'MEMBER':
    case 'OWNER':
      return true
    default:
      return false
  }
}
