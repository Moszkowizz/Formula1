'use strict';

const Homey = require('homey');
const FormulaOneApi = require('./lib/FormulaOneApi');

class FormulaOne extends Homey.App {
	
	onInit() {
		this.api = new FormulaOneApi();

		this.setTimerRaceStart();

		// todo trigger flow

    	this.raceStartTriggerFlow = new Homey.FlowCardTrigger('race_start');
		this.raceStartTriggerFlow
    		.register();
	}

	async setTimerRaceStart() {
		this.nextRace = await this.api.getNextRace();
		//this.raceStartTime = new Date(`${this.nextRace.date}T${this.nextRace.time}`);
		this.raceStartTime = new Date(`2019-07-26T11:13:00`);

		console.log('Tijd ding 1', this.raceStartTime);

		const timeDelta = this.raceStartTime.getTime() - Date.now();
		console.log('tijd ding 2', timeDelta);

		setTimeout(() => {
			console.log('Starting flow!');
			this.raceStartTriggerFlow.trigger()
				.catch(console.error());
		}, timeDelta);
	}

	async getData() {
		const result = await this.api.getNextRace();
		console.log(`${(Homey.__("location"))} :${result.circuit}`);

		const winner = await this.api.getWinner();
		console.log('Winner', winner);

		this.api.getTopThree();
	}
}

module.exports = FormulaOne;