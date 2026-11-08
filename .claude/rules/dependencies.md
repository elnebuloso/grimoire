# Dependencies

- **Pinned to an exact version, at least two weeks old:** npm packages, images in examples and
  GitHub Actions. Security fixes are the exception to the two weeks.
- **A GitHub Action is pinned by the commit SHA of its version tag**, with the tag as a comment
  (`actions/checkout@<sha> # v7.0.1`): a tag can be moved. `gh api repos/<owner>/<action>/git/ref/tags/<tag>`
  gives the SHA; an annotated tag needs one more `git/tags/<sha>` lookup.
- **Node follows its major version, not a release:** the base image of the `Dockerfile`
  (`node:24-trixie-slim`) and the Node of CI (`'24'`) take the newest release of that line at
  every build, so security fixes arrive without a change. A new major version is a change of its
  own.
