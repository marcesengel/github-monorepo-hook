# `github-monorepo-hook`

`github-monorepo-hook` allows you to easily use
`GitHub` web hooks with monorepos.

It detects which packages in your monorepo have been
changed on a push event. The change detection analyzes
the packages themselves and their local dependencies based
on a configuration file in the monorepo. This allows you to
do expensive package specific operations (like building,
publishing etc.) only in case your code has actually changed.

In addition `github-monorepo-hook` supports verification of
the events using the GitHub web hook secret. This helps to
prevent injection of malicious code into your
(build/publication/etc.) processes, which otherwise is easily
possible with public web hooks.
See [this section](#secret) for more details.

## Setup

First you need to set up your monorepo for use with
`github-monorepo-hook`. To do so, create a file called
`packages.json` at the root of your monorepo. It should look
like the following:

```json
[
  {
    "name": "backend",
    "dependencies": [
      "db",
      "mail-queuer"
    ]
  }
]
```

This will cause your `backend` package to be flagged as
changed in case files in there, your `db` package or in
your `mail-queuer` packages have changed.

You may use `.deployignore` files in your monorepo to
block certain paths and files inside your packages from
being analyzed. Use one line per rule, glob is allowed.

## Usage

This is a usage example for an AWS Lambda function behind an
AWS API Gateway:

```js
const getChangedPackages = require('github-monorepo-hook')

const options = {
  branch: 'master', // defaults to none
  packagePath: 'src/packages/' // defaults to 'packages/'
}

exports.handler = async (event) => {
  // event is an object containing web hook request body and headers
  const changedPackages = await getChangedPackages(
    event,
    options
  )

  console.log(changedPackages)
  /*
    logs an array of the package configurations
    for the changed packages - this enables you
    to use the "packages.json" for deployment
    configurations etc. Just add custom keys to
    the entries and use them in your application
  */
}
```

### Secret

To enable event verification simply create an environment
variable called `GITHUB_SECRET` containing your secret.
`github-monorepo-hook` will resolve to `false` if the
incomming event failed the verification. See
[the official documentation](https://developer.github.com/webhooks/securing/#setting-your-secret-token)
for more information on how to set your own secret token.

### Private Repositories

To use `github-monorepo-hook` with private repositories,
simply set an environment variable called `GITHUB_TOKEN`
to a valid [GitHub access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/).
