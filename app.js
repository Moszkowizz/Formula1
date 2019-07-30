'use strict';

const Homey = require('homey');
const FormulaOneApi = require('./lib/FormulaOneApi');

const AFTER_RACE_TIMEOUT = 2.5 * 60 * 60 * 1000; // 2.5 hours in miliseconds
const RACE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in miliseconds
const DATA_REFRESH_TIMEOUT = 24 * 60 * 60 *1000; // 24 hours data refresh in milliseconds

class FormulaOne extends Homey.App {
	
	onInit() {
		this.api = new FormulaOneApi();

		this.fillDriverStandingTokens();

		// Flows aanmaken
    	this.raceStartTriggerFlow = new Homey.FlowCardTrigger('race_start');
		this.raceStartTriggerFlow
			.register();

		this.raceStartsInTriggerFlow = new Homey.FlowCardTrigger('race_in');
		this.raceStartsInTriggerFlow
			.register()
			.registerRunListener(async (args, state) => {
				if (args.time_before == state.time) return true;
				else return false;
			})

		this.raceWonByTriggerFlow = new Homey.FlowCardTrigger('winner');
		this.raceWonByTriggerFlow
			.register();

		this.isRacingConditionFlow = new Homey.FlowCardCondition('is_racing');
		this.isRacingConditionFlow
			.register()
			.registerRunListener(async (args, state) => {
				return this.isRaceOngoing();
			})
	
		// Flows triggeren
		this.setTimerRaceStart();
		this.setTimerBeforeRaceStart();
		this.triggerWinnerFlow();

		// Create app tokens
		this.driverStandingTokens = [];
		for (var counter = 0; counter <= 19; counter++) {
			this.driverStandingTokens.push(
				new Homey.FlowToken(`standing_${counter}`, {
					type: 'string',
					title: `Postion ${1 + counter}`
				})
			);
		}
		this.driverStandingTokens.forEach(standingToken => {
			standingToken.register();
		})

		setTimeout(() => {
			this.fillDriverStandingTokens();
		}, 3000);

		// Updater loopje
		this.updaterLoop = setInterval(() => {
			this.log('Updating data from API');
			this.fillDriverStandingTokens();
			this.setTimerRaceStart();
			this.setTimerBeforeRaceStart();
			this.triggerWinnerFlow();
		}, DATA_REFRESH_TIMEOUT);
	}

	async setTimerRaceStart() {
		this.nextRace = await this.api.getNextRace();
		this.raceStartTime = new Date(`${this.nextRace.date}T${this.nextRace.time}`);

		const timeDelta = (this.raceStartTime.getTime() - Date.now());

		if (timeDelta <= 0) return; // We don't want to trigger after the race has started

		this.raceStartTimeout = setTimeout(() => {
			this.log('Starting race starts trigger');
			this.raceStartTriggerFlow.trigger({
				race_name: this.nextRace.raceName,
				circuit: this.nextRace.circuit,
			})
				.catch(err => this.log(err));
		}, timeDelta);
	}

	async setTimerBeforeRaceStart() {
		this.nextRace = await this.api.getNextRace();
		this.raceStartTime = new Date(`${this.nextRace.date}T${this.nextRace.time}`);

		const timeDelta = (this.raceStartTime.getTime() - Date.now());

		if (timeDelta <= 0) return; // We don't want to trigger after the race has started

		this.log('Setting timers for before_start trigger with timeout', timeDelta);

		this.fiveMinRaceTimeout = setTimeout(() => {
			this.log('Triggering 5 minutes start timer');
			this.raceStartsInTriggerFlow.trigger({
				race_name: this.nextRace.raceName,
				circuit: this.nextRace.circuit,
			}, {time: "5"} );
		}, (timeDelta - (5*60*1000)) );

		this.tenMinRaceTimeout = setTimeout(() => {
			this.log('Triggering 10 minutes start timer');
			this.raceStartsInTriggerFlow.trigger({
				race_name: this.nextRace.raceName,
				circuit: this.nextRace.circuit,
			}, {time: "10"} );
		}, (timeDelta - (10*60*1000)) );

		this.thirtyMinRaceTimeout = setTimeout(() => {
			this.log('Triggering 30 minutes start timer');
			this.raceStartsInTriggerFlow.trigger({
				race_name: this.nextRace.raceName,
				circuit: this.nextRace.circuit,
			}, {time: "30"} );
		}, (timeDelta - (30*60*1000)) );

		this.sixtyMinRaceTimeout = setTimeout(() => {
			this.log('Triggering 60 minutes start timer');
			this.raceStartsInTriggerFlow.trigger({
				race_name: this.nextRace.raceName,
				circuit: this.nextRace.circuit,
			}, {time: "60"} );
		}, (timeDelta - (60*60*1000)) );
	}

	async triggerWinnerFlow() {
		const nextRace = await this.api.getNextRace();
		const raceStartTime = new Date(`${nextRace.date}T${nextRace.time}`);

		const refreshTimeOut = raceStartTime.getTime() + AFTER_RACE_TIMEOUT;
		const timeout = refreshTimeOut - Date.now();
		
		this.winnerTimeout = setTimeout(async () => {
			const winnerData = await this.api.getWinner();
			this.raceWonByTriggerFlow.trigger({
				driver_name: `${winnerData.givenName} ${winnerData.familyName}`,
			})
		}, timeout);
	}

	async isRaceOngoing() {
		const nextRace = await this.api.getNextRace();
		const raceStartTime = new Date(`${nextRace.date}T${nextRace.time}`);

		const refreshTimeOut = raceStartTime.getTime() + AFTER_RACE_TIMEOUT;
		const timeout = refreshTimeOut - Date.now();

		if (timeout > 0 && timeout <= RACE_DURATION) return true;
		else return false;
	}

	async fillDriverStandingTokens() {
		const standings = await this.api.getDriverStandings();

		var counter = 0;
		standings.forEach(standing => {
			this.driverStandingTokens[counter].setValue(`${standing.position}. ${standing.givenName} ${standing.familyName}`);
			counter++;
		})
	}
}

module.exports = FormulaOne;