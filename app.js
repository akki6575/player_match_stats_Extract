const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
let app = express();
app.use(express.json());
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();
//API 1
app.get("/players/", async (request, response) => {
  const dbQuery = "Select * from player_details;";
  const playersResponse = await db.all(dbQuery);
  let as = (playersResponse) => {
    return {
      playerId: playersResponse.player_id,
      playerName: playersResponse.player_name,
    };
  };
  response.send(playersResponse.map((each) => as(each)));
});

//API 2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `Select * from player_details where player_id=${playerId};`;
  const playerDetail = await db.get(dbQuery);
  let as = (playersResponse) => {
    return {
      playerId: playersResponse.player_id,
      playerName: playersResponse.player_name,
    };
  };
  response.send(as(playerDetail));
});
//API 3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailsToBeUpdated = request.body;
  const { playerName } = playerDetailsToBeUpdated;
  const dbQuery = `Update player_details set player_name='${playerName}' where player_id=${playerId};`;
  await db.run(dbQuery);
  response.send("Player Details Updated");
});
//API 4
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `Select * from match_details where match_id=${matchId};`;
  const dbResponse = await db.get(dbQuery);
  let as = (matchDetails) => {
    return {
      matchId: matchDetails.match_id,
      match: matchDetails.match,
      year: matchDetails.year,
    };
  };
  response.send(as(dbResponse));
});
//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `Select * from player_match_score NATURAL JOIN match_details where player_id=${playerId}`;
  const dbResponse = await db.all(dbQuery);
  let as = (matchDetails) => {
    return {
      matchId: matchDetails.match_id,
      match: matchDetails.match,
      year: matchDetails.year,
    };
  };
  response.send(dbResponse.map((each) => as(each)));
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `Select player_details.player_id as playerId,player_details.player_name as playerName from player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const dbResponse = await db.all(dbQuery);

  response.send(dbResponse);
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const player_stats = await db.get(getPlayerScored);
  console.log(player_stats);

  response.send(player_stats);
});

module.exports = app;
