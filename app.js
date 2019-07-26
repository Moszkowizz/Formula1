'use strict';

const Homey = require('homey');
const FormulaOneApi = require('./lib/FormulaOneApi');

class FormulaOne extends Homey.App {
	
	onInit() {
		this.api = new FormulaOneApi();

		this.nextRace = this.api.getNextRace();
		// todo trigger flow


    	let raceStartTrigger = new Homey.FlowCardTrigger('race_start');
		raceStartTrigger
    		.register()
    	raceStartTrigger.trigger()
        	.catch( this.error )
			.then( this.log )
		
		this.getData();
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