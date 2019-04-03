'use strict';

const Homey = require('homey');

class MyApp extends Homey.App {
	
	onInit() {
		const fetch = require('node-fetch');

		async function getRaces() {
		    const res = await fetch('http://ergast.com/api/f1/current.json');
		    const json = await res.json();
		    return json.MRData.RaceTable.Races;
		}

		getRaces()
		    .then(races => {
		        races.forEach(race => {
		            console.log(race.raceName, race.date, race.time)
		        });
		    })
		    .catch(error => {
		        console.error(error)
		    })
    	let raceStartTrigger = new Homey.FlowCardTrigger('race_start');
		raceStartTrigger
    		.register()
    	raceStartTrigger.trigger()
        	.catch( this.error )
        	.then( this.log )
	}
	
}


module.exports = MyApp;