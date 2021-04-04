# Changelog

## [0.2.4](https://github.com/decoverto/decoverto/compare/v0.2.3...v0.2.4) (2021-04-04)

* improve documentation

## [0.2.3](https://github.com/decoverto/decoverto/compare/v0.2.2...v0.2.3) (2021-04-03)

* Rewrite documentation
  * Document inheritance
  * Improve documentation as a whole
  * Document playground


## [0.2.2](https://github.com/decoverto/decoverto/compare/v0.2.1...v0.2.2) (2021-04-02)

### Bug Fixes

* correct JSDoc on rawToInstance and instanceSetToPlain ([1acd2d2](https://github.com/decoverto/decoverto/commit/1acd2d2c09aca3f4aefa9fede85f2e27027cbc29))
* correct own entry in LICENSE ([6412755](https://github.com/decoverto/decoverto/commit/6412755208a7ed88a1b27c87201ccf51dd1dde3e))
* prevent MapShape erasure on compilation ([869272a](https://github.com/decoverto/decoverto/commit/869272addb59be1233f62e99421499ec5dd59b83))


## [0.2.1](https://www.github.com/decoverto/decoverto/compare/v0.2.0...v0.2.1) (2021-04-01)

### ⚠ BREAKING CHANGES

* rename xInstanceToRaw methods ([4afac0a](https://www.github.com/decoverto/decoverto/commit/4afac0adf833a1938085bd58b30355767f040eb8))  
  `arrayInstanceToRaw` is now `instanceArrayToRaw`. `setInstanceToRaw` is now `instanceSetToRaw`.

### Features

* add default value for TypeHandler generic parameter Raw ([228e5fd](https://www.github.com/decoverto/decoverto/commit/228e5fdb6554be8f53e66c9355f284f5a843c48d))
* support multilevel inheritance ([0509af1](https://www.github.com/decoverto/decoverto/commit/0509af1f2c1663f11b4836bc490e88915511c54f))
* throw error when multiple inheritance strategies are set in the chain ([4f1865e](https://www.github.com/decoverto/decoverto/commit/4f1865ec59dfffaafcc789a7341c896978559842))
