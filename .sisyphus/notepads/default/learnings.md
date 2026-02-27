Fixed npm install error by making openviking peerDependency optional in packages/core/package.json.

- Added peerDependenciesMeta with "openviking": { "optional": true } directly after the "peerDependencies" block.
- No versions changed; only metadata added.
