'use strict'

const fetch = require('node-fetch');

const ApiUrl = 'http://ergast.com/api/f1/';
const format = '.json';

module.exports = class FormulaOneApi {
    async apiCall(path) {
        const url = `http://ergast.com/api/f1/${path}.json`;
        console.log('Fetching', url);
        const res = await fetch(url);
        const json = await res.json();
        return json;
    }

    async getNextRace() {
        const json = await this.apiCall('current/next');
        const race = json.MRData.RaceTable.Races[0];
        return {
            raceName: race.raceName,
            round: race.round,
            circuit: race.Circuit.circuitName,
            country: race.Circuit.Location.country,
            date: race.date,
            time: race.time,
        }
    }

    async getWinner(race = 'last') {
        const json = await this.apiCall(`current/${race}/results`);
        const winner = json.MRData.RaceTable.Races[0].Results[0].Driver;
        return {
            givenName: winner.givenName,
            familyName: winner.familyName,
        }
    }

    async getTopThree(race = 'last') {
        const json = await this.apiCall(`current/${race}/results`);
        const results = [];
        json.MRData.RaceTable.Races[0].Results.forEach(result => {
            if (result.position > 3) return;
            results.push({
                postion: result.position,
                givenName: result.Driver.givenName,
                familyName: result.Driver.familyName,
            });
       });

       return results;
    }

    async getDriverStandings() {
        const json = await this.apiCall(`current/driverStandings`);
        const results = [];
        json.MRData.StandingsTable.StandingsLists[0].DriverStandings.forEach(standing => {
            results.push({
                position: standing.position,
                givenName: standing.Driver.givenName,
                familyName: standing.Driver.familyName,
            });
       });

       return results;
    }
}