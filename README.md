# Preparing for building Sisyphus on Github Actions

Prepare "gradle.properties" needed by [sisyphus](https://github.com/ButterCam/sisyphus) building.

## Inputs to 'gradle.properties' mapping

input | gradle.properties | descriptor
-|-|-
developer | sisyphus.developer | Set developer name for developing environment.
snapshot-repositories | sisyphus.snapshot.repositories | Repositories for snapshot publishing, default value is `snapshot`.
release-repositories | sisyphus.release.repositories | Repositories for release publishing, default value is `release`.
docker-repositories | sisyphus.docker.repositories | Repositories for docker publishing.
config-repositories | sisyphus.config.repositories | Repositories for resolving configuration artifact, default value is `local,central,jcenter,portal`.
dependency-repositories | sisyphus.dependency.repositories | Repositories for resolving dependencies, default value is `local,central,jcenter,portal`.
config-artifacts | sisyphus.config.artifacts | Configuration artifacts.
gradle-portal-key | gradle.publish.key | Publish key for gradle portal.
gradle-portal-secret | gradle.publish.secret | Publish secret for gradle portal.
gpg-key-name | signing.gnupg.keyName | Gunpg key name of signing.

### Dynamic input mapping

input | gradle.properties | descriptor
-|-|-
`name`-url | sisyphus.repositories.`name`.url | Url of repository.
`name`-username | sisyphus.repositories.`name`.username | Optional, user name of repository.
`name`-password | sisyphus.repositories.`name`.password | Optional, password of repository.

> Dynamic input will cause some warning of Github Actions.
