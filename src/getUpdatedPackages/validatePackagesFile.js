const validatePackagesFile = (packages) => {
  const { sameNamedPackages } = packages.reduce(
    ({ packageNames, sameNamedPackages }, package) => {
      const { name } = package

      if (packageNames.includes(name)) {
        return {
          packageNames,
          sameNamedPackages: sameNamedPackages.concat(name)
        }
      }

      return {
        packageNames: packageNames.concat(name),
        sameNamedPackages
      }
    },
    {
      packageNames: [],
      sameNamedPackages: []
    }
  )

  if (sameNamedPackages.length > 0) {
    throw new Error('Duplicate package names in "packages.json": ' + sameNamedPackages.map((name) => '"' + name + '"').join(', '))
  }
}

module.exports = validatePackagesFile
