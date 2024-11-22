Here is a `README.md` file for your project:

# Sports Match Details API

This project provides an API to fetch details about various sports matches, including football, cricket, and basketball. The API is built using Node.js, Express, and GraphQL.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/sports-match-details-api.git
   cd sports-match-details-api
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your API key:
   ```env
   API_KEY=your_api_key_here
   ```

## Usage

To start the server, run:

```sh
npm start
```

The server will start on port `8080` by default. You can access the GraphQL playground at `http://localhost:8080/graphql`.

## API Endpoints

### GraphQL Queries

#### Get Matches List

Fetch a list of matches for a specific sport and date.

```graphql
query getMatchesList(
  $date: String!
  $timeZoneDiff: String
  $sportName: String!
  $isLive: Boolean!
  $isCricket: Boolean!
) {
  getMatchesList(
    date: $date
    timeZoneDiff: $timeZoneDiff
    sportName: $sportName
    isLive: $isLive
    isCricket: $isCricket
  ) {
    matches {
      competitionName
      competitionId
      uniqueId
      competitionImage
      venue
      events {
        matchId
        homeTeam {
          name
          id
          imageUrl
          isBatting
        }
        awayTeam {
          name
          id
          imageUrl
          isBatting
        }
        startTime
        matchStatus
        homeScore
        awayScore
        winnerTeam
        note
      }
    }
    featuredMatch {
      event {
        matchId
        homeTeam {
          name
          id
          imageUrl
          isBatting
        }
        awayTeam {
          name
          id
          imageUrl
          isBatting
        }
        startTime
        matchStatus
        homeScore
        awayScore
        winnerTeam
        note
      }
      competitionName
      competitionId
    }
  }
}
```

#### Get Football Details

Fetch details of a football competition.

```graphql
query getFootballDetails($compId: Int!) {
  getFootballDetails(compId: $compId) {
    matches {
      fixtures {
        matchId
        homeTeam {
          name
          id
          imageUrl
          isBatting
        }
        awayTeam {
          name
          id
          imageUrl
          isBatting
        }
        startTime
        matchStatus
        homeScore
        awayScore
        winnerTeam
        note
      }
      results {
        matchId
        homeTeam {
          name
          id
          imageUrl
          isBatting
        }
        awayTeam {
          name
          id
          imageUrl
          isBatting
        }
        startTime
        matchStatus
        homeScore
        awayScore
        winnerTeam
        note
      }
    }
    standings {
      group
      teamId
      teamImageUrl
      position
      name
      played
      wins
      loses
      draws
      GF
      GA
      GD
      points
    }
  }
}
```

#### Get Competition Details

Fetch details of a competition.

```graphql
query getCompetitionDetails(
  $compId: ID
  $uniqueId: ID!
  $dateState: String!
  $isCricket: Boolean!
) {
  getCompetitionDetails(
    compId: $compId
    uniqueId: $uniqueId
    dateState: $dateState
    isCricket: $isCricket
  ) {
    matchSet {
      matches {
        matchId
        homeTeam {
          name
          id
          imageUrl
          isBatting
        }
        awayTeam {
          name
          id
          imageUrl
          isBatting
        }
        startTime
        matchStatus
        homeScore
        awayScore
        winnerTeam
        note
      }
      hasNextPage
    }
    seasonId
    standingSet {
      standings {
        name
        teamId
        teamImageUrl
        position
        wins
        losses
        played
        percentage
        points
        netRunRate
      }
      groupName
    }
  }
}
```

## Environment Variables

The following environment

variables

are required:

- `API_KEY`: Your API key for accessing the sports data.

## Project Structure

```
.
├── controllers/
│   ├──

getBasketballMatchDetails.js


│   ├──

getCompDetails.js


│   ├──

getCricketMatchDetails.js


│   ├──

getFeaturedMatches.js


│   ├──

getFootballMatchDetails.js


│   └──

getMatches.js


├── graphql/
│   ├──

resolvers.js


│   └──

schema.js


├── util/
│   ├──

api-helper.js


│   ├──

competition-helper.js


│   ├──

match-detail-helper.js


│   └──

transform-data.js


├── .env
├── .gitignore
├──

app.js


├──

data.txt


├──

package.json


└── README.md
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

## License

This project is licensed under the MIT License.

```
Feel free to customize this `README.md` file as needed for your project.
```
