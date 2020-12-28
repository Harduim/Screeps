[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Harduim_Screeps&metric=alert_status)](https://sonarcloud.io/dashboard?id=Harduim_Screeps)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Harduim_Screeps&metric=code_smells)](https://sonarcloud.io/dashboard?id=Harduim_Screeps)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Harduim_Screeps&metric=ncloc)](https://sonarcloud.io/dashboard?id=Harduim_Screeps)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Harduim_Screeps&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=Harduim_Screeps)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# Screeps
An AI for the screeps.com Game running on [my account](https://screeps.com/a/#!/profile/Harduim)

Screeps is an open-source game for programmers, wherein the core mechanic is programming
your units' AI. You control your colony by writing JavaScript.

![base_screen_grab](screeps_base_ss.png)

## Implemented

### Roles
- Upgrader
- Harvester
- Energy resource distribuiter
- Remote harvester
- Remote storage hauler
- Energy migrator
- Link energy migrator
- Regular soldier
- Ranger soldier
- Healer
- Demolisher
- Tank

### Structures
- Spawn
- Towers
- Links

### Features
- Simple automatic base building
- Role switching accourding to base necessities
- Auto road building to the main room landmarks
- Remote Harvesting
- Basic room defense

## Not Implemented yet

### Roles
- Miner
- Remote Miner
- Wall/Rampart Repairer
- AOE Soldier
- Scout

### Structures
- Labs
- Factory
- Terminal

### Features
- Dynamic Base builder, including all structures
- Base rebuilder
- Better inter-room resource sharing
- Mining and boosting
- Market
- Soldier Squads
- Proximity room grouping
- Spawning queue, based on the room grouping
- Define creep role quantities based on room economy 


## To Do
- Find a better code formatter
- Figure out a way to integrate some profiler
- Benchmark energy efficiency of different logistics models
