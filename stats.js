//Version 0.8
// - Added Images
// - Scroll bar hidden
// - Added missing QI stats
// - Added chain buildings
// - Added comma formatting for display of results.
//Version 0.7
// - Added Ally stats to totals
//Version 0.6
// - Added the combined efficiency column when selecting to sort by either red or blue
//Version 0.5
// - Added FP/square, and Sort by total FP / FP/square options
//Version 0.4
// - Downgrade temporary buildings option
// - Unpacks SK's and applying Upgrade Kits from inventory before displaying the final items
// - 2024 Epic QI SK only extracts to Neo King so that it doesn't flood the inventory with partial items
// - fixed getting the current player name.  It now needs the user to have opened the GBG leaderboard at least once in the past though because there was no other way to retrieve it other than from FOE Helper's GBG leaderboard cache.

const images = (function () {
  const _urls = {
    attacking_attack_gbg:             "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_attacking_attack_gbg-6698c3c31.png", // <img src='${images("attacking_attack_gbg")}' style='width:20px;height:20px;vertical-align:middle;'>
    attacking_defense_gbg:            "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_attacking_defense_gbg-ddc716eef.png", // <img src='${images("attacking_defense_gbg")}' style='width:20px;height:20px;vertical-align:middle;'>
    attacking_attack_gr:              "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_attacking_attack_gr-55242b40c.png", // <img src='${images("attacking_attack_gr")}' style='width:20px;height:20px;vertical-align:middle;'>
    attacking_defense_gr:             "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_attacking_defense_gr-e56d51f6b.png", // <img src='${images("attacking_defense_gr")}' style='width:20px;height:20px;vertical-align:middle;'>
    defending_attack_gbg:             "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_defending_attack_gbg-3eacd4cf6.png", // <img src='${images("defending_attack_gbg")}' style='width:20px;height:20px;vertical-align:middle;'>
    defending_defense_gbg:            "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_defending_defense_gbg-2a54e8a2f.png", // <img src='${images("defending_defense_gbg")}' style='width:20px;height:20px;vertical-align:middle;'>
    defending_attack_gr:              "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_defending_attack_gr-98387c45e.png", // <img src='${images("defending_attack_gr")}' style='width:20px;height:20px;vertical-align:middle;'>
    defending_defense_gr:             "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_defending_defense_gr-2b802719e.png", // <img src='${images("defending_defense_gr")}' style='width:20px;height:20px;vertical-align:middle;'>
	combinedGbGAttacking:             "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_attacking_all_gbg-b4df0c8df.png", // <img src='${images("combinedGbGAttacking")}' style='width:20px;height:20px;vertical-align:middle;'>
	combinedGbGDefending:             "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_defending_all_gbg-8c6ef372b.png", // <img src='${images("combinedGbGDefending")}' style='width:20px;height:20px;vertical-align:middle;'>
	combinedGbGAttackingandDefending: "https://foeus.innogamescdn.com/assets/shared/gui/boost/boost_icon_bonus_attacking_defending_all_gbg-1d7abd477.png", // <img src='${images("combinedGbGAttackingandDefending")}' style='width:20px;height:20px;vertical-align:middle;'>
	};
  function getUrl(key) {
    return _urls[key] || "";
  }
  getUrl.all = _urls;
  return getUrl;
})();

function formatCommas(num) { return Number(num).toLocaleString("en-US"); };

const icon = (key, title = '') =>
    `<img src='${images(key)}' alt='${title}' title='${title}' ` +
    `style='width:20px;height:20px;vertical-align:middle;'>`;

(function() {
    

    // run this after the rest of the snippet finishes parsing
    setTimeout(async()=> {
        if (typeof(localStorage.current_player_name) == 'undefined')
            localStorage.current_player_name = await getNameFromFOEHelperDB();

        new BuildingStats();
    }, 0);


})();

async function getNameFromFOEHelperDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(`FoeHelperDB_${localStorage.current_player_id}`);
        request.onsuccess = e => {
            const db = e.target.result;
            const transaction = db.transaction("statsGBGPlayerCache");
            const store = transaction.objectStore("statsGBGPlayerCache");
            const getRequest = store.get(parseInt(localStorage.current_player_id));
            getRequest.onsuccess = e => resolve(e.target.result.name);
        };
        request.onerror = e => reject(e.target.error);
    });
}

function addAllyStats(totals) {
	let allyList = MainParser?.Allies?.allyList || {};

	for (let allyId in allyList) {
		let ally = allyList[allyId];
		if (!ally || !ally.currentLevel) continue;

		let boostsArr = ally.currentLevel.boosts || [];
		for (let boost of boostsArr) {
			let tFeature = boost.targetedFeature;
			if (typeof tFeature === "string") {
				tFeature = [tFeature];
				if (tFeature[0] !== "guild_raids") {
					tFeature.push("all");
				}
			}

			let bType = boost.type;
			let val = boost.value || 0;

			let appliesToQI   = tFeature.includes("guild_raids");
			let appliesToCity = tFeature.includes("all");

			if (bType === "att_boost_attacker") {
				if (appliesToCity) totals.attackingAttack += val;
				if (appliesToQI)   totals.QIAttackingAttack += val;
			}
			else if (bType === "def_boost_attacker") {
				if (appliesToCity) totals.attackingDefense += val;
				if (appliesToQI)   totals.QIAttackingDefense += val;
			}
			else if (bType === "att_def_boost_attacker") {
				if (appliesToCity) {
					totals.attackingAttack  += val;
					totals.attackingDefense += val;
				}
				if (appliesToQI) {
					totals.QIAttackingAttack  += val;
					totals.QIAttackingDefense += val;
				}
			}
			else if (bType === "att_boost_defender") {
				if (appliesToCity) totals.defendingAttack += val;
				if (appliesToQI)   totals.QIDefendingAttack += val;
			}
			else if (bType === "def_boost_defender") {
				if (appliesToCity) totals.defendingDefense += val;
				if (appliesToQI)   totals.QIDefendingDefense += val;
			}
			else if (bType === "att_def_boost_defender") {
				if (appliesToCity) {
					totals.defendingAttack  += val;
					totals.defendingDefense += val;
				}
				if (appliesToQI) {
					totals.QIDefendingAttack  += val;
					totals.QIDefendingDefense += val;
				}
			}
		}
	}
}

class BuildingStats {
    #defaultSort = "efficiency";
    #defaultShow = "both";

    constructor() {
        const self = this;
        // Expose the main API object to the global scope.  Not self contained for dev purposes (re-running the snippet to see changes)
        window.stats = this._stats = (window.stats || {});
        stats.self = this;
        this.inventory = {};

        this.initializeDefaults();
        
        this.initializeFoEHelperBindings(); // this must be after this.stats is initialized
        this.reinitializeStats();

        this.reinitializeUI();
        this.displaySelf();

        this.inventoryRefreshInterval = setInterval(() => {
            if (stats.self != self)
            {
                clearInterval(self.inventoryRefreshInterval);
                self.inventoryRefreshInterval = false;
                return;
            }

            if (!self.stats.isOther && self.overlay.is(".inventory.dirty"))
                self.displayInventory();
        }, 1000)
    }

    initializeDefaults() {
        this.settings.showInventory ??= true;
        this.settings.downgradeTemporaryItems ??= true;
    }

    displaySelf() {
        this.setBuildings(MainParser.CityMapData);
        this.displayBuildings();
        this.displayInventory();
    }

    displayOther() {
        this.setBuildings(MainParser.OtherPlayerCityMapData, this.stats.otherPlayerName, this.stats.otherPlayerEra);
        this.displayBuildings();
        this.displayInventory();
    }
    
    get storage() {
        return X.storage;
    }
    
    get stats() {
        return this._stats;
    }

    reinitializeStats() {
        let stats = this.stats;
        stats.otherPlayerEra = stats.otherPlayerEra || false;
    }
    
    initializeFoEHelperBindings() {
        const self = this;
        if (!FoEproxy.FoEproxyInitializedBindings)
        {
            FoEproxy.FoEproxyInitializedBindings = true;
            FoEproxy.addHandler("OtherPlayerService", "visitPlayer", (msg) => {
                self.stats.self.onVisitPlayer(msg);
            })
            let savedMethods = {};
            for(let method of ["UpdateInventoryAmount", "UpdateInventory", "UpdateInventoryItem"])
            {
                savedMethods[method] = MainParser[method];
                MainParser[method] = function() {
                    self.stats.self.overlay.addClass("dirty");
                    console.log("Inventory is dirty");
                    return savedMethods[method].apply(MainParser, arguments);
                }
            }
        }
    }

    reinitializeUI() {
        this.removeUI();
        this.css = `
            span.aEfficiency,span.bEfficiency,span.dEfficiency {
                display: inline-block;
                min-width: 4em;
            }

            div#stats-overlay [title] { cursor: help; }
            .efHigh { color: #6bc86b; font-weight: bold; }
            .efLow { color: #e47373; font-weight:bold; }
            .efNone { color: gray; }
            .efMid { color: #9c9cff; }
            span.player-name.other { color: pink; }

            table.stats-data tr.important td {
                background-color: rgb(17 17 187);
            }
            
            table.stats-data tr span.isHidden {
                cursor:pointer;
                margin-left: 10px;
            }

            table.stats-data tr span.isImportant {
                cursor:pointer;
                margin-left: 10px;
            }

            table.stats-data tr.important span.isImportant {
                text-shadow: 0 0 1px #1579ff;
                color:transparent;
            }
            table.stats-data tr:not(.important) span.isImportant {
                text-shadow: 0 0 1px #888;
                color:transparent;
            }

            .stats-data > thead {
                position: sticky;
                background: #222;
            }
            table#inventory-table > thead {
                top: 60px;
            }
            table#stats-table > thead {
                top: 153px;
            }
            table.stats-data > thead > tr > th {
                padding: 0.6em 1em 0.6em 0;
            }

            table.stats-data td {
                padding: 5px;
                border-bottom: 1px solid #444;
            }

            table.stats-data tr.important {
                rgb(17 17 187);
            }

            table.stats-data tr > td:not(:first-child) {
                white-space:nowrap;
            }
        `;        

        this.initializeCollapseControl();
        this.initializeOverlay();
        this.overlay.append($("<style>"+this.css+"</style>"));

    }

    removeUI() {
        $("#stats-overlay,#stats-collapse-control").remove(); // remove old UI if we're re-running
    }

    initializeOverlay() {
        const self = this;
        const overlay = this.overlay = $(`<div id='stats-overlay' class='${this.shouldInventoryDisplay()?"inventory":""} ${this.stats.isOther?"other":""}'>
          <div id='building-stats'>
            <div id='stats-header'>
                <button class='close'>Close</button>
                <button class='show show-own'>Show Own City</button>
                <button class='show show-other'>Show Other City</button>
                <h2>City Building Efficiency Overview</h2>
                <div class=totals></div>
                Sort: <select id='city-sort' class=sorter>
                        <option value='efficiency'>Total Efficiency</option>
                        <optgroup label='Attacker efficiency'>
                            <option value='Aefficiency'>A. Off + Def</option>
                            <option value='AOefficiency'>A. Offense</option>
                            <option value='ADefficiency'>A. Defense</option>
                        </optgroup>
                        <optgroup label='Defender efficiency'>
                            <option value='Defficiency'>D. Off + Def</option>
                            <option value='DOefficiency'>D. Offense</option>
                            <option value='DDefficiency'>D. Defense</option>
                        </optgroup>
                        <optgroup label='Forge Points'>
                            <option value='FPefficiency'>FP/square</option>
                            <option value='FP'>FP/day</option>
                        </optgroup>
                    </select>
                | 
                <input type=checkbox id='show-hidden-buildings'> <label style='margin-left:5px;' onclick='$(this).prev().click()' title="Whether or not to show buildings you've marked as hidden (the eyeball on each row)">Show Hidden</label>
                <input type=checkbox id='show-inventory'> <label style='margin-left:5px;' onclick='$(this).prev().click()'>Show Inventory</label>
                | <span title="Whether to display percentages, efficiency/square numbers, or both">Show:</span> <select id='stats-to-show'>
                    <option value='%'>Percentages</option>
                    <option value='#'>Efficiency</option>
                    <option value='both'>% & Efficiency</option>
                </select>
                </div>
            <div id='building-body'>
                <table id='stats-table' class='stats-data'>
					<thead><tr>
					    <th>Item</th><th>Qty</th><th>Size</th><th>Space</th><th>FP/sq</th>
					
					    <!-- red attacker -->
					    <th attr="AO">${icon('attacking_attack_gbg',  'Attacker Attack')}</th>
					    <th attr="AD">${icon('attacking_defense_gbg', 'Attacker Defence')}</th>
					    <th attr="Aefficiency">${icon('combinedGbGAttacking','Attacker Atk & Def')}</th></th>
					
					    <!-- blue defender -->
					    <th attr="DO">${icon('defending_attack_gbg',  'Defender Attack')}</th>
					    <th attr="DD">${icon('defending_defense_gbg', 'Defender Defence')}</th>
					    <th attr="Defficiency">${icon('combinedGbGDefending','Def-Atk')}</th>
					
					    <!-- purple total -->
					    <th attr="totalEfficiency">${icon('combinedGbGAttackingandDefending','Att-Atk')}</th>
					
					    <th></th><th></th>
					<tbody></tbody>
					</tbody>
                </table>
            </div>
          </div>
          <div id='inventory'>
              <div id='inventory-header'>
                  Test
              </div>
              <div id='inventory-body'>
              </div>
          </div>
        </div>`)
        .appendTo("body");

        this.css += `#stats-overlay {
            position: fixed;
            top: 0; right: 00%; bottom: 0; overflow: auto;
            left: 20%;
            background-color: #222;
            z-index: 10000;
            padding: 0px;
            font-family: Verdana, Arial, sans-serif;
        }

        #stats-overlay.other .if-self { display: none; }
        #stats-overlay:not(.over) .if-other-player {display: none; }
        #stats-header, #inventory-header {
            position: sticky; top: 0px; 
            background: #222;
            padding: 20px 20px 10px 20px;
            margin-bottom: 10px;
            border-bottom: 1px dashed #555;
        }
        #stats-header h2, #stats-header div.totals,
        #inventory-header h2, #inventory-header div.totals
        { padding-bottom: 15px; }
        
        table.stats-data {
            text-align: left;
            width: 100%;
        }

        table.stats-data > thead > th { padding-right: 8px; }

        table.stats-data tr >:first-child
        {
            padding-left: 1em;
        }
        table.stats-data .size1,table.stats-data .size2,table.stats-data .statPercent {
            display: inline-block;
            min-width: 3.3em;
        }

        #stats-overlay #building-stats, #stats-overlay #inventory {
            width: 100%;
        }

        #stats-overlay.inventory #building-stats {
            position: absolute;
            top: 0px;
            bottom: 40%;
        }

        #stats-overlay.inventory #inventory {
            position: absolute;
            top: 60%;
            bottom: 0px;
        }

        #stats-overlay:not(.dirty) .if-inventory-dirty { display: none; }

        #stats-overlay:not(.inventory) div#inventory{
            display: none;
        }

        #stats-overlay.inventory div#inventory {
            border-top: 5px dashed #767676;
            text-align: left; 
        }

        #stats-overlay.inventory #building-stats {
        }

        #stats-overlay #inventory, #stats-overlay #building-stats {
            overflow: auto;
        }

        button#exp-inv, button#imp-inv { float: right; }

        table.stats-data[sort="efficiency"] [attr="Aefficiency"],
        table.stats-data[sort="efficiency"] [attr="Defficiency"],
        table.stats-data[sort="FP"] [attr="Aefficiency"],
        table.stats-data[sort="FP"] [attr="Defficiency"],
        table.stats-data[sort="FPefficiency"] [attr="Aefficiency"],
        table.stats-data[sort="FPefficiency"] [attr="Defficiency"],
        table.stats-data[sort="Defficiency"] [attr="Aefficiency"],
        table.stats-data[sort="DOefficiency"] [attr="Aefficiency"],
        table.stats-data[sort="DDefficiency"] [attr="Aefficiency"],
        table.stats-data[sort="Aefficiency"] [attr="Defficiency"],
        table.stats-data[sort="AOefficiency"] [attr="Defficiency"],
        table.stats-data[sort="ADefficiency"] [attr="Defficiency"] {
            display: none;
        }
        `;

		// Hides scroll bars so no bright white bars.
		this.css += `
		#stats-overlay,
		#stats-overlay * {
			scrollbar-width:none;
			-ms-overflow-style:none;
		}
		#stats-overlay::-webkit-scrollbar,
		#stats-overlay *::-webkit-scrollbar {
			display:none;
		}
		`;


        // Initialize sorter
        overlay.find("select.sorter")
            .val(this.settings.sort || this.#defaultSort)
            .on("input", function() {
                self.settings.sort = $(this).val();
                self.displayBuildings();
            })

        overlay.find("select#stats-to-show")
            .val(this.settings.show || this.#defaultShow)
            .on("input", function() {
                self.settings.show = $(this).val();
                self.displayBuildings();
                self.displayInventory();
            })

        
        // Close button
        overlay.find("button.close").click(() => { self.removeUI(); self.shutdown = true; })    ;
        this.css += `.stats-header button.close {
            margin-bottom: 10px,
            background-color: #555,
            color: white,
            border: none,
            padding: 5px 10px,
            cursor: pointer;
        }`;
    
        overlay.find(".show-own").click(self.displaySelf.bind(this));
        overlay.find(".show-other").click(self.displayOther.bind(this));
    
        //initialize the 'Show hidden buildings' checkbox
        overlay.find("#show-hidden-buildings")
            .prop("checked", this.settings.showHidden||false)
            .change(function() {
                self.settings.showHidden = $(this).is(":checked");
                self.displayBuildings();
                self.displayInventory();
            })

        //initialize the 'Show hidden buildings' checkbox
        overlay.find("#show-inventory")
            .prop("checked", this.settings.showInventory)
            .change(function() {
                self.settings.showInventory = $(this).is(":checked");
                self.displayInventory();
                overlay.toggleClass("inventory", this.shouldInventoryDisplay());
            })

    }
    
    initializeCollapseControl() {
        const collapseControlPosition = this.settings.collapseControlPosition = (this.settings.collapseControlPosition || {left: "50%", top: "10px"});
        const collapseControl = $("<div id='stats-collapse-control'>Hide Stats</div>")
            .css({position: "fixed",
                width: "200px",
                padding: "10px",
                backgroundColor: "#444",
                cursor: "pointer",
                textAlign: "center",
                zIndex: 21001,
                left: collapseControlPosition.left,
                top: collapseControlPosition.top,
            })
            .appendTo("body")
            .click(() => {
                collapseControl.text($("#stats-overlay").toggle().is(":visible") ? "Hide Stats" : "Show Stats");
            })
    
        // Make the collapse control draggable
            .on("mousedown", function(event) {
                event.preventDefault();
                let shiftX = event.clientX - collapseControl[0].getBoundingClientRect().left;
                let shiftY = event.clientY - collapseControl[0].getBoundingClientRect().top;
            
                function moveAt(pageX, pageY) {
                    collapseControl[0].style.left = pageX - shiftX + 'px';
                    collapseControl[0].style.top = pageY - shiftY + 'px';
                }
            
                function onMouseMove(event) {
                    moveAt(event.pageX, event.pageY);
                }
            
                document.addEventListener('mousemove', onMouseMove);
            
                collapseControl[0].onmouseup = function() {
                    document.removeEventListener('mousemove', onMouseMove);
                    collapseControl[0].onmouseup = null;
            
                    // Save position relative to the nearest corner
                    const rect = collapseControl[0].getBoundingClientRect();

                    collapseControlPosition.left = rect.left + "px";
                    collapseControlPosition.top = rect.top + "px";
                };
            })
        
        // Prevent default drag behavior
        collapseControl[0].ondragstart = () => false;
    }
    
    onVisitPlayer(response) {
        response = response.responseData;
        this.stats.otherPlayerEra = response.other_player_era;
        this.stats.otherPlayerName = response.other_player.name;

        if (this.shutdown) return;

        setTimeout(this.displayOther.bind(this), 200);
    }

    get buildingDatabase() {
        if (this._buildingDatabase)
            return this._buildingDatabase;

        if (!this.storage.buildingDatabase)
            this.storage.buildingDatabase = {};

        return this._buildingDatabase = this.storage.buildingDatabase;
    }

    get settings() {
        if (this._settings)
            return this._settings;

        if (!this.storage.buildingStatsSettings)
            this.storage.buildingStatsSettings = {};

        return this._settings = this.storage.buildingStatsSettings;
    }

    // Function to calculate and display totals
    calculateTotals(buildingEntries) {
        let totalAOffense = 0;
        let totalADefense = 0;
        let totalDOffense = 0;
        let totalDDefense = 0;
        let GBs = !this.stats.isOther;

        // QI additions
        let totalQI_AOffense = 0;
        let totalQI_ADefense = 0;
        let totalQI_DOffense = 0;
        let totalQI_DDefense = 0;

        buildingEntries.forEach(({ Aoffense, Adefense, Doffense, Ddefense, quantity, cityentity_id, type,
                                   QI_Aoffense, QI_Adefense, QI_Doffense, QI_Ddefense }) => {
            if (!GBs && cityentity_id.indexOf("Landmark") >= 0)
                return;
            totalAOffense += Aoffense * quantity;
            totalADefense += Adefense * quantity;
            totalDOffense += Doffense * quantity;
            totalDDefense += Ddefense * quantity;

            totalQI_AOffense += (QI_Aoffense || 0) * quantity;
            totalQI_ADefense += (QI_Adefense || 0) * quantity;
            totalQI_DOffense += (QI_Doffense || 0) * quantity;
            totalQI_DDefense += (QI_Ddefense || 0) * quantity;
        });

        // Place partial sums in an object for ally merging
        let totals = {
            attackingAttack: totalAOffense,
            attackingDefense: totalADefense,
            defendingAttack: totalDOffense,
            defendingDefense: totalDDefense,
            QIAttackingAttack: totalQI_AOffense,
            QIAttackingDefense: totalQI_ADefense,
            QIDefendingAttack: totalQI_DOffense,
            QIDefendingDefense: totalQI_DDefense
        };

        // Merge in ally stats
        addAllyStats(totals);

        // Overwrite local totals after merging
        totalAOffense = totals.attackingAttack;
        totalADefense = totals.attackingDefense;
        totalDOffense = totals.defendingAttack;
        totalDDefense = totals.defendingDefense;
        totalQI_AOffense = totals.QIAttackingAttack;
        totalQI_ADefense = totals.QIAttackingDefense;
        totalQI_DOffense = totals.QIDefendingAttack;
        totalQI_DDefense = totals.QIDefendingDefense;

		this.overlay.find(".totals").html(
		  ` Player: <span class='${this.stats.isOther ? "player-name other" : "player-name own"}'>
		      ${this.stats.currentPlayer}</span> |
		    Era: ${this.stats.era}<br/>
		    <img src='${images("attacking_attack_gbg")}'  style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalAOffense)}&nbsp;|&nbsp;
		    <img src='${images("attacking_defense_gbg")}' style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalADefense)}&nbsp;|&nbsp;
		    <img src='${images("defending_attack_gbg")}'  style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalDOffense)}&nbsp;|&nbsp;
		    <img src='${images("defending_defense_gbg")}' style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalDDefense)}<br/>

		    <img src='${images("attacking_attack_gr")}'  style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalQI_AOffense)}&nbsp;|&nbsp;
		    <img src='${images("attacking_defense_gr")}' style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalQI_ADefense)}&nbsp;|&nbsp;
		    <img src='${images("defending_attack_gr")}'  style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalQI_DOffense)}&nbsp;|&nbsp;
		    <img src='${images("defending_defense_gr")}' style='width:20px;height:20px;vertical-align:middle;'> ${formatCommas(totalQI_DDefense)}`
		  + (GBs ? "" : "<br/><i><small>Not including GBs</small></i>")
		);

        if (typeof window.statTracking != 'undefined')
            window.statTracking({player: this.stats.currentPlayer, era: this.stats.era, AOffense: this.totalAOffense, ADefense: this.totalDDefense, DOffense: this.totalDOffense, DDefense: this.totalDDefense});
    }

    getClassForEfficiency(efficiency) {
        if (isNaN(efficiency)) return "efNone";
        if (efficiency >= 10) return "efHigh";
        if (efficiency >= 5) return "efMid";
        if (efficiency >= 2.5) return "efMid";
        if (efficiency >= 0) return "efLow";
        return "efNone";
    }
    
    // Display buildings function
    displayBuildings() {
        const self = this;
        const buildingCounts = this.groupBuildings();
        const table = this.overlay.find("#stats-table");
        const buildingDatabase = this.buildingDatabase;
        const buildingEntries = Object.entries(buildingCounts).map(([cityentityId, { quantity }]) => {
            const res = self.getBuildingInfo(cityentityId);
            res.quantity = quantity;
            return res;
        });
        // Sort entries: missing data rows (orange) at the top, then by efficiency descending
        buildingEntries.sort((a, b) => {
            const sort = self.settings.sort || this.#defaultSort;
            return b[sort] - a[sort];
        });

        // Calculate and display totals
        this.calculateTotals(buildingEntries);

        this.displayItemsOnTable(buildingEntries, table);

        table.attr("sort", this.settings.sort || this.#defaultSort);
    }

    setBuildings(buildings, player=false, era=false) {
        let stats = this.stats;
        stats.currentPlayer = player || localStorage.current_player_name;
        stats.era = era || CurrentEra || "SpaceAgeSpaceHub";
        stats.isOther = this.stats.currentPlayer != localStorage.current_player_name;
        stats.buildings = buildings;
    }
    
    // Function to group buildings by their cityentityId and count occurrences
    groupBuildings() {
        const buildings = Object.values(stats.buildings); // Assuming buildings data is in MainParser.CityMapData
        return buildings.reduce((acc, building) => {
            const cityentityId = building.cityentity_id;
            if (!acc[cityentityId]) {
                acc[cityentityId] = { quantity: 0 };
            }
            acc[cityentityId].quantity += 1;
            return acc;
        }, {});
    }

    getBuildingInfo(cityentity_id, isChained = false) {
        const entity = MainParser.CityEntities[cityentity_id];
        if (!entity) throw new Error(`Unknown cityentity_id '${cityentity_id}'`);
    
        let Aoffense = 0;
        let Adefense = 0;
        let Doffense = 0;
        let Ddefense = 0;
        
        // QI additions
        let QI_Aoffense = 0;
        let QI_Adefense = 0;
        let QI_Doffense = 0;
        let QI_Ddefense = 0;

        let length = entity.length || entity.components?.AllAge?.placement?.size?.y || undefined;
        let width = entity.width || entity.components?.AllAge?.placement?.size?.x || undefined;
        let roads;
        let type = entity.type;

    
        // Calculate roads only if length and width are defined
        if (length && width) {
            let min = Math.min(length, width);
            roads = min > 5 ? 1 : min; // Adjusted based on user preference without *2
        }

        let allAttStatsBoost = this.getBoostForEntity(entity, this.stats.era, "att_def_boost_attacker_defender");
        
        let att_boost_attacker = this.getBoostForEntity(entity, this.stats.era, "att_boost_attacker");
        let att_def_boost_attacker = this.getBoostForEntity(entity, this.stats.era, "att_def_boost_attacker");
        let def_boost_attacker = this.getBoostForEntity(entity, this.stats.era, "def_boost_attacker");
        Aoffense = att_boost_attacker + att_def_boost_attacker + allAttStatsBoost;
        Adefense = def_boost_attacker + att_def_boost_attacker + allAttStatsBoost;

        let att_boost_defender = this.getBoostForEntity(entity, this.stats.era, "att_boost_defender");
        let att_def_boost_defender = this.getBoostForEntity(entity, this.stats.era, "att_def_boost_defender");
        let def_boost_defender = this.getBoostForEntity(entity, this.stats.era, "def_boost_defender");
        Doffense = att_boost_defender + att_def_boost_defender + allAttStatsBoost;
        Ddefense = def_boost_defender + att_def_boost_defender + allAttStatsBoost;

        // QI additions
        let QIattBoostAttacker = this.getBoostForEntity(entity, this.stats.era, "att_boost_attacker", "guild_raids");
        let QIattDefBoostAttacker = this.getBoostForEntity(entity, this.stats.era, "att_def_boost_attacker", "guild_raids");
        let QIdefBoostAttacker = this.getBoostForEntity(entity, this.stats.era, "def_boost_attacker", "guild_raids");
        QI_Aoffense = QIattBoostAttacker + QIattDefBoostAttacker;
        QI_Adefense = QIdefBoostAttacker + QIattDefBoostAttacker;

        let QIattBoostDefender = this.getBoostForEntity(entity, this.stats.era, "att_boost_defender", "guild_raids");
        let QIattDefBoostDefender = this.getBoostForEntity(entity, this.stats.era, "att_def_boost_defender", "guild_raids");
        let QIdefBoostDefender = this.getBoostForEntity(entity, this.stats.era, "def_boost_defender", "guild_raids");
        QI_Doffense = QIattBoostDefender + QIattDefBoostDefender;
        QI_Ddefense = QIdefBoostDefender + QIattDefBoostDefender;

		let both = this.getBoostForEntity(entity,this.stats.era,"att_def_boost_attacker_defender","guild_raids");
		QI_Aoffense  += both;
		QI_Adefense  += both;
		QI_Doffense  += both;
		QI_Ddefense  += both;

        let FP = this.getBoostForEntity(entity, this.stats.era, "fp");

        if (entity.asset_id.indexOf("Landmark") != -1 || entity.asset_id == "X_AllAge_EasterBonus4")
        {
            let gb = false;
            for (let i in MainParser.CityMapData)
            {
                if (MainParser.CityMapData[i].cityentity_id == entity.asset_id)
                {
                    gb = MainParser.CityMapData[i];
                    break;
                }
            }

            let boosts = gb.bonus;
            if (boosts)
            {
                if (boosts.type == "military_boost" || boosts.type == "advanced_tactics")
                {
                    Aoffense += boosts.value;
                    Adefense += boosts.value;
                }
                if (boosts.type == "advanced_tactics" || boosts.type == "fierce_resistance")
                {
                    Doffense += boosts.value;
                    Ddefense += boosts.value;
                }
            }
        }

        const needsRoads = entity.components?.AllAge?.streetConnectionRequirement?.requiredLevel 
            || entity.requirements?.street_connection_level
            || (["greatbuilding"].includes(type) ? 1 : 0);

        if (roads !== undefined)
            roads = needsRoads * roads;

        if (!needsRoads)
            roads = 0;

        let sizeForEfficiency = (length * width) + roads/2;

        if (entity.abilities) {
            for (const ability of entity.abilities) {
                if (ability.__class__ === "ChainLinkAbility") {
                    let linkBoost = ability.bonusGiven?.boost?.[this.stats.era] ?? ability.bonusGiven?.boost?.AllAge ?? ability.bonusGiven?.boost;
                    console.log("ChainLinkAbility for", entity.name, "linkBoost:", linkBoost);
                    if (linkBoost) {
                        if (linkBoost.type === "att_boost_attacker") {
                            console.log("Adding att_boost_attacker", linkBoost.value, "to Aoffense for", entity.name);
                            Aoffense += linkBoost.value;
                        }
                        if (linkBoost.type === "att_boost_defender") {
                            console.log("Adding att_boost_defender", linkBoost.value, "to Doffense for", entity.name);
                            Doffense += linkBoost.value;
                        }
                        if (linkBoost.type === "def_boost_attacker") {
                            console.log("Adding def_boost_attacker", linkBoost.value, "to Adefense for", entity.name);
                            Adefense += linkBoost.value;
                        }
                        if (linkBoost.type === "def_boost_defender") {
                            console.log("Adding def_boost_defender", linkBoost.value, "to Ddefense for", entity.name);
                            Ddefense += linkBoost.value;
                        }
                        if (linkBoost.type === "att_def_boost_attacker") {
                            console.log("Adding att_def_boost_attacker", linkBoost.value, "to Aoffense and Adefense for", entity.name);
                            Aoffense += linkBoost.value;
                            Adefense += linkBoost.value;
                        }
                        if (linkBoost.type === "att_def_boost_defender") {
                            console.log("Adding att_def_boost_defender", linkBoost.value, "to Doffense and Ddefense for", entity.name);
                            Doffense += linkBoost.value;
                            Ddefense += linkBoost.value;
                        }
                    }
                }
            }
        }

        // Only include length, width, and roads if they are defined
        const result = {
            name: entity.name,
            cityentity_id: entity.asset_id,
            Aoffense,
            Adefense,
            Atotal: Aoffense + Adefense,
            Doffense,
            Ddefense,
            Dtotal: Doffense + Ddefense,
            type,
            needsRoads,
            size: sizeForEfficiency,
            length: length,
            width: width,
            roads: roads,
            efficiency: sizeForEfficiency ? (Aoffense + Adefense + Doffense + Ddefense) / sizeForEfficiency : 0,
            Aefficiency: sizeForEfficiency ? (Aoffense + Adefense) / sizeForEfficiency : 0,
            AOefficiency: sizeForEfficiency ? Aoffense / sizeForEfficiency : 0,
            ADefficiency: sizeForEfficiency ? Adefense / sizeForEfficiency : 0,
            Defficiency: sizeForEfficiency ? (Doffense + Ddefense) / sizeForEfficiency : 0,
            DOefficiency: sizeForEfficiency ? Doffense / sizeForEfficiency : 0,
            DDefficiency: sizeForEfficiency ? Ddefense / sizeForEfficiency : 0,
            hidden: (this.buildingDatabase[entity.asset_id]?.hidden) || false,
            important: (this.buildingDatabase[entity.asset_id]?.important || false),
            FP: FP,
            FPefficiency: sizeForEfficiency ? FP / sizeForEfficiency : 0,
            // QI additions
            QI_Aoffense,
            QI_Adefense,
            QI_Doffense,
            QI_Ddefense,
        };

        return result;
    };

    getBoostForEntity(entity, era, wantedBoost, targetedFeature="battleground") {

	if (typeof(targetedFeature) == "string")
	{
		targetedFeature = [targetedFeature];
		if (targetedFeature[0] != "guild_raids")
			targetedFeature.push("all");
	}

        if (typeof(entity) == 'string')
            entity = MainParser.CityEntities[entity];

        if (!entity)
            throw Error("Unknown entity");
        
        let total = 0;
        
        for (const age of ["AllAge", era]) {

            if (wantedBoost == "fp")
            {
                const production = entity?.components?.[age]?.production;
                const options = production?.options || [];
                
                if (!production || !production.autoStart)
                    continue;

                for (let i = 0; i < options.length; i++)
                {
                    let option = options[i];
                    let multiple = 86400 / option.time;
                    if (!option.products || !option.products.length) continue;

                    for (let k = 0; k < option.products.length; k++)
                    {
                        let product = option.products[k];
                        if (product.type == "resources")
                            total += (product?.playerResources?.resources?.strategy_points || 0) * multiple;
                    }
                }
                continue;
            }
            
            const boosts = entity?.components?.[age]?.boosts?.boosts || [];
            for (const boost of boosts) {
                if (targetedFeature.includes(boost.targetedFeature) && boost.type == wantedBoost)
                    total += boost.value;
            }
            if (entity.abilities) {
                for (const ability of entity.abilities) {
                    const boosts = ability?.boostHints || [];
                    for (const hint of boosts) {
                        const hintMap = hint.boostHintEraMap;
                        if (!hintMap) continue;
                        if (!hintMap[age]) continue;
                        if (!targetedFeature.includes(hintMap[age].targetedFeature)) continue;
                        if (hintMap[age].type != wantedBoost) continue;
                        total += hintMap[age].value;
                    }
                }
            }

        }
        return total;
    }

    shouldInventoryDisplay() {
        return this.settings.showInventory;
    }
    
    displayInventory() {
        const overlay = $("#stats-overlay #inventory-body");
        const header = $("#stats-overlay #inventory-header");
        overlay.empty();
        if (!this.shouldInventoryDisplay())
        {
            this.overlay.removeClass("inventory"); // this.overlay is not the same as 'overlay' in local scope
            return;
        }
        else this.overlay.addClass("inventory");

        this.overlay.removeClass("dirty");

        header.html(
            `<h2 style='float:left;margin-right:3em;'>Inventory</h2>
            <div style='float:left;'>Sort: <select id='inventory-sort' class=sorter>
                <option value='efficiency'>Total Efficiency</option>
                <optgroup label='Attacker efficiency'>
                    <option value='Aefficiency'>A. Off + Def</option>
                    <option value='AOefficiency'>A. Offense</option>
                    <option value='ADefficiency'>A. Defense</option>
                </optgroup>
                <optgroup label='Defender efficiency'>
                    <option value='Defficiency'>D. Off + Def</option>
                    <option value='DOefficiency'>D. Offense</option>
                    <option value='DDefficiency'>D. Defense</option>
                </optgroup>
                <optgroup label='Forge Points'>
                    <option value='FPefficiency'>FP/square</option>
                    <option value='FP'>FP/day</option>
                </optgroup>                
            </select>
            <input type=checkbox name='inv-downgrade' id='inv-downgrade'><label for='inv-downgrade' onclick='$(this).prev().click()' title="If selected, temporary buildings will show in their downgraded form so that you're looking at long-term value rather than temporary value. This is highly recommended."> Downgrade temporary buildings</label>
            <input type=checkbox name='inv-neo-max' id='inv-neo-max'><label for='inv-neo-max' onclick='$(this).prev().click()' title="If selected, incomplete Neo buildings (such as neo sentinal outpost l1, neo king l1) will not show, they will only show once you can build them to the max level.  Since this tool is not able to recommend upgrading buildings that are already in your city, this is recommended."> Hide Neo buildings under max level</label>
            <span class='if-inventory-dirty'> |<Span style='color:#ff9090;'> Your inventory has changed and this list needs to be refreshed</span></span>
        </div>
<!--            <span class='if-other-player'><button title="Import the other player's inventory" id="imp-inv">Import Inventory</button></span>
            <span class='if-self'><button title="Exports your inventory to send to another player to receive help with it. This will let them see your inventory if you send it to them." id="exp-inv">Export Inventory</button></span>
-->            <div style='clear:both;'></div>
        `
        );
        overlay.append(`<table id='inventory-table' class='stats-data'>
						<thead><tr>
							<th>Item</th><th>Qty</th><th>Size</th><th>Space</th><th>FP/sq</th>
							<th attr="AO">${icon('attacking_attack_gbg','Attacker Attack')}</th>
							<th attr="AD">${icon('attacking_defense_gbg','Attacker Defence')}</th>
							<th attr="Aefficiency">${icon('combinedGbGAttacking','Attacker Atk & Def')}</th>
							<th attr="DO">${icon('defending_attack_gbg','Defender Attack')}</th>
							<th attr="DD">${icon('defending_defense_gbg','Defender Defence')}</th>
							<th attr="Defficiency">${icon('combinedGbGDefending','Def-Atk')}</th>
							<th attr="totalEfficiency">${icon('combinedGbGAttackingandDefending','Att-Atk')}</th>
							<th></th><th></th>
						</tr></thead>
						<tbody></tbody>
					</table>`);

        this.loadInventory();

       // Initialize sorter
        let self = this;
        header.find("select.sorter")
            .val(this.settings.inventorySort || this.#defaultSort)
            .on("input", function() {
                self.settings.inventorySort = $(this).val();
                self.displayInventoryItems();
            })

        let downgrade = header.find("input#inv-downgrade")
        if (this.settings.downgradeTemporaryItems)
            downgrade.prop("checked", "checked");
        downgrade.on("input", function(){
            self.settings.downgradeTemporaryItems = $(this).is(":checked");
            self.displayInventory();
        })
        
        let assemble = header.find("input#inv-assemble")
        if (!this.settings.dontAssemble)
            assemble.prop("checked", "checked");
        assemble.on("input", function(){
            self.settings.dontAssemble = !$(this).is(":checked");
            self.displayInventory();
        })

        let neoMax = header.find("input#inv-neo-max")
        if (this.settings.neoMaxOnly)
            neoMax.prop("checked", "checked");
        neoMax.on("input", function(){
            self.settings.neoMaxOnly = $(this).is(":checked");
            self.displayInventory();
        })
        
        this.displayInventoryItems();
    }

    displayInventoryItems() {
        let sortBy = this.settings.inventorySort || this.#defaultSort;
        let inventory = Object.values(this.inventory).sort((a,b) => {
            let val = (b[sortBy]??0) - (a[sortBy]??0);
            if (val == 0)
            {
                val = (b.efficiency??0) - (a.efficiency??0);
                if (val == 0)
                    val = (b.FPefficiency??0) - (a.FPefficiency??0);
            }

            return val;
        })
        let tbody = $("#inventory-table > tbody");
        tbody.empty();
        this.displayItemsOnTable(inventory, $("#inventory-table"));
        $("#inventory-table").attr("sort", this.settings.inventorySort || this.#defaultSort);
    }

    displayItemsOnTable(itemList, table) {
        const tbody = table.find("> tbody");
        const settings = this.settings;
        const self = this;
        const show = this.settings.show || this.#defaultShow;
        tbody.empty();
        itemList.forEach((item) => {
            if (item.hidden && !this.settings.showHidden) return;
            if (["hub_main", "main_building", "street", "outpost_ship", "off_grid", "friends_tavern"].includes(item.type))
                return;

            let rowClasses = [];
            let hiddenText = "👁️";
            let assetId = item.cityentity_id??item.assetName;

            if (item.hidden) {
                rowClasses.push("hidden");
                hiddenText = "👁️‍🗨️";
            }
            if (item.important)
                rowClasses.push("important");
            
            let roadsText = "";
            if (item.needsRoads)
                roadsText = "<span title='+"+item.roads+" roads'>+"+item.roads+"</span>";

            let sizeText = "<span class=size1>"+item.size + "</span>";
            if (item.quantity > 1)
                sizeText += " <Span class=size2>("+(item.quantity*item.size)+")</span>";
            if (!item.size) sizeText = "";

            let dimensionsText = item.length + "x" + item.width + " " + roadsText;
            if (!item.size)
                dimensionsText = "";

            let fp = "";
            if (item.FPefficiency > 0)
                fp = item.FPefficiency.toFixed(1);
            
            let $tr = $(`<tr data-asset-id='${assetId}' class="${rowClasses.join(" ")}">
                <td attr='name'>${item.name}
                <td attr='quantity'>${item.quantity}
                <td attr='dimensions'>${dimensionsText}
                <td attr='space'>${sizeText}</td>
                <td attr='FP'>${fp}</td>
                </tr>
                `);
            item.statTotal = item.Aoffense + item.Doffense + item.Adefense + item.Ddefense;
            for (let stat of [['Aoffense', 'AOefficiency'], ['Adefense', 'ADefficiency'], ['Atotal', 'Aefficiency'], ['Doffense', 'DOefficiency'], ['Ddefense', 'DDefficiency'], ['Dtotal', 'Defficiency'], ['statTotal', 'efficiency']])
            {
                if (typeof item[stat[1]] == 'undefined')
                {
                    $tr.append("<td>");
                    continue;
                }

                let $td = $(`<td attr='${stat[1]}' class='${this.getClassForEfficiency(item[stat[1]])}'>`);
                if (show == "both" || stat[0] == "statTotal")
                    $td.html(`<span class='statPercent'>${item[stat[0]]}%</span> (${item[stat[1]].toFixed(1)})`);
                else if (show == "%")
                    $td.text(item[stat[0]] + "%");
                else if (show == "#")
                    $td.text(item[stat[1]].toFixed(1));
                $tr.append($td);
            }

            $tr.append(`<td>
                    <span class='isImportant'>🏳️</span>
                    <span class='isHidden'>${hiddenText}</span>
                </td>`)

            $tr.find("span.isImportant").click(() => {
                $tr.toggleClass("important");
                self.buildingDatabase[assetId] = self.buildingDatabase[assetId] || {};
                self.buildingDatabase[assetId].important = $tr.is(".important");
            })

            $tr.find("span.isHidden").click(()=>{
                $tr.toggleClass("hidden");
                self.buildingDatabase[assetId] = self.buildingDatabase[assetId] || {};
                self.buildingDatabase[assetId].hidden = $tr.is(".hidden");
                if (self.settings.showHidden || !$tr.is(".hidden"))
                {
                    self.displayBuildings();
                    if (self.settings.showInventory && $("#inventory-table tr[data-asset-id='"+$tr.attr("data-asset-id")+"']").length)
                        self.displayInventory();
                }
                else
                    self.overlay.find("tr[data-asset-id='"+$tr.attr("data-asset-id")+"']").remove();
            })
            
            tbody.append($tr);
        });
    }
    
    loadInventory() {
        this.inventory = {};
        let test = {};

        for (let item of Object.values(MainParser.Inventory))
        {
            if (!item.itemAssetName || item.itemAssetName == "icon_fragment") continue;

            this.addInventoryItem(item.itemAssetName, item.inStock, item.name);
        }
        this.applyInventoryUpgrades();
    }

    addInventoryItem(assetName, quantity=1, name=undefined, relatedUpgradeKit=undefined) {
        const self = this;
        if (MainParser.SelectionKits[assetName] )//&& !this.settings.dontAssemble )
        {
            let upgradeKits = [];
            let kitItems = MainParser.SelectionKits[assetName]?.eraOptions?.[stats.era]?.options;
            if (!kitItems)
            {
                console.log("Can't find selection kit items for "+assetName + " era "+stats.era);
                return;
            }

            for (let x = 0; x < kitItems.length; x++)
            {
                let kitItem = kitItems[x];

                if (assetName == "selection_kit_epic_GR24_2" && 
                   !["Neo King - Lv. 1", "Neo King Upgrade Kit"].includes(kitItem.name))
                    continue;
                
                this.addInventoryItem(kitItem.itemAssetName, quantity, kitItem.name); // using parent quantity itentionally here; kitItem.quantity is probably always 1, but if we are adding 8SKs we need to add 8 of each item it could produce
                // if this is an upgrade kit, check if the original upgrade item is in the same SK
                if (MainParser.BuildingUpgrades[kitItem.itemAssetName])
                {
                    for (let y = 0; y < kitItems.length; y++)
                        if (MainParser.BuildingUpgrades[kitItem.itemAssetName]?.upgradeSteps[0]?.buildingIds?.[0] == kitItems[y].itemAssetName)
                            upgradeKits.push({kit: kitItem.itemAssetName, mainItem: kitItems[y].itemAssetName, upgradeItem: kitItem.itemAssetName, quantity: quantity})
                }
            }

            if (upgradeKits.length)
            {
                upgradeKits.forEach((kit) => {
                    let invItem = self.inventory[kit.mainItem];
                    invItem.fromKits = invItem.fromKits || [];
                    invItem.fromKitsQuantity = (invItem.fromKitsQuantity||0) + quantity;
                    invItem.fromKits.push(kit);
                });
//                originalConsole.log("Found upgrade kit / main building SK pair in SK "+assetName+" ("+MainParser.SelectionKits[assetName].name+")", upgradeKits);
            }
            return;            
        }

        if (this.inventory[assetName])
        {
            this.inventory[assetName].quantity += quantity;
            return;
        }
        
        name = name
                ?? MainParser.CityEntities[assetName]?.name 
                ?? MainParser.BuildingUpgrades?.[assetName]?.upgradeItem?.name
                ?? MainParser.SelectionKits?.[assetName]?.name
                ?? ("Unknown item "+assetname);

        this.inventory[assetName] = {
            assetName: assetName,
            quantity: quantity,
            name: name,
        };
    }

    applyInventoryUpgrades() {
        let changed;
        let kitIds = Object.keys(MainParser.BuildingUpgrades);

        if (!this.settings.dontAssemble) do {
            changed = false;
            for (let kitId of kitIds)
            {
                if (!this.inventory[kitId]) continue;
                
                let kit = MainParser.BuildingUpgrades[kitId];
                let steps = kit.upgradeSteps.slice(0).reverse();

                let quantity = this.inventory[kitId].quantity;
                let innerChanged = false;
                innerChanged = false;
                if (quantity > 0) do
                {
                    innerChanged = false;
                    let current = steps[0].buildingIds;
                    let replacements;

                    for (let x = 1; x < steps.length; x++)
                    {
                        replacements = current;
                        current = steps[x].buildingIds;

                        if (this.inventory[current[0]]?.quantity)
                        {
                            if (this.inventory[current[0]].fromKitsQuantity == this.inventory[current[0]].quantity && this.inventory[current[0]].quantity == 1 && this.inventory[current[0]].fromKits[0].upgradeItem == kitId)
                            {
//                                console.log("Preventing double use of kit item", "item:", this.inventory[current[0]], "upgrade item:", this.inventory[kitId]);
                                continue;
                            }
                            quantity--;
                            if (this.inventory[current[0]].fromKitsQuantity == this.inventory[current[0]].quantity)
                            {
                                // this item comes from an SK that had a main item / kit combo. Deduct an additional main item when using this kit
                                let remove = 2;
                                for (let i = 0; i < this.inventory[current[0]].fromKits.length && remove; i++)
                                {
                                    let kit = this.inventory[current[0]].fromKits[i];
                                    while (kit.upgradeItem == kitId && kit.quantity > 0 && remove)
                                    {
                                        kit.quantity--;
                                        remove--;
                                    }
                                }

//                                console.log("Found related kit ",this.inventory[kitId]);
                                quantity--;
                                this.inventory[kitId].quantity--;
                                // we have to deduct two of these items, one for the one we're upgrading, one from the upgrade kit
                                this.inventory[current[0]].fromKitsQuantity -= 2;
                                this.inventory[current[0]].quantity--; // the other is deducted below
                            }
                            this.inventory[kitId].quantity--; // deduct the upgrade item
                            this.inventory[current[0]].quantity--; // deduct the item that's being upgraded from inventory
                            for (let replacement of replacements) // some kits upgrade to a final selection (ie tower of conjunction goes to 4 options) add one of each 4 options so that they can be compared.
                            {
                                this.addInventoryItem(replacement, 1)
//                                console.log("Upgrade "+this.inventory[current[0]].name + " to "+this.inventory[replacement].name);
                            }

                            changed = innerChanged = true;
                            break; // upgrade the highest ranked items first
                        }
                    }
                } while (quantity > 0 && innerChanged);
            }
        } while (changed); // loop until nothing can be upgraded, since one upgrade kit might make another upgrade kit usable

        if (this.settings.downgradeTemporaryItems) // show the downgraded versions instead of the active versions of ascended buildings and temporary buildings
        {
            for (let assetId in this.inventory)
            {
                let item = this.inventory[assetId];
                if (!item.quantity) continue;
                let newItem = MainParser.CityEntities[assetId]?.components?.AllAge?.limited?.config?.targetCityEntityId;
                if (!newItem) continue;
                this.addInventoryItem(newItem, item.quantity);
                item.quantity = 0;
            }
        }
        
        // clean up this.inventory for use in generating tables
        for (let assetId in this.inventory)
        {
            let sort = this.settings.inventorySort || this.#defaultSort
            
            if (this.settings.neoMaxOnly
                && this.inventory[assetId].name.substr(0,4) == "Neo ")
            {
                let lv = this.inventory[assetId].name.split("Lv. ")[1]??false
                if ((this.inventory[assetId].name.substr(4, 3) == "Col" && lv < 10)
                    || lv == 1)
                {
                    delete this.inventory[assetId];
                    continue;
                }
            }
            
            if (!this.inventory[assetId].quantity // remove quantity 0 items from inventory (used upgrade kits, buildings that have been upgraded and have no remaining quantity)
               || !MainParser.CityEntities[assetId] // remove all unusable kits, boosts, etc.  Anything that isn't in MainParser.CityEntities can't be placed in the city.
            )
            {
                if (!this.settings.dontAssemble || (!MainParser.BuildingUpgrades[assetId] && !MainParser.SelectionKits[assetId]))
                    delete this.inventory[assetId];
                continue;
            }

            // everything else, let's get stats for
            let stats = this.getBuildingInfo(assetId);
            if (((sort == "FP" || sort == "FPefficiency") && stats.FPefficiency< 0.25)
                ||
                (sort != "FP" && sort != "FPefficiency" && stats.efficiency < 2.5))
            {
                // remove item if there's no attack stats
                delete this.inventory[assetId];
                continue;
            }

            // copy stats to inventory object
            for (let i in stats)
                this.inventory[assetId][i] = stats[i];
        }
    }
}

function getChainedBuildings(cityMapData) {
    // Returns a Set of cityentity_ids that are part of a valid chain
    const chained = new Set();
    for (const building of Object.values(cityMapData)) {
        if (building.abilities) {
            for (const ability of building.abilities) {
                if (ability.__class__ === "ChainLinkAbility") {
                    // Check if this building is actually chained (adjacent to a valid link)
                    if (isBuildingChained(building, cityMapData)) {
                        chained.add(building.cityentity_id);
                    }
                }
            }
        }
    }
    return chained;
}

function isBuildingChained(building, cityMapData) {

    return true;
}

window.X = window.X || {};
/**
localStorage object proxy  for simplifying saving/loading of persistent data like which buildings are hidden & size information
ex: s.foo = 1;  s.bar = { x: 1}; s.bar.x++;   delete s.foo;
Next load, the properties of 's' will persist.
**/
X.storage = X.storage || new Proxy({
        getStoredData: function(){
            let s_data = X.storage_data;
            if (!s_data)
            {
                if (s_data = localStorage.myStorage)
                    s_data = JSON.parse(s_data);
                else
                    s_data = {};
                X.storage_data = s_data;

            }
            return s_data;
        },
        saveStoredData: function(){
            if (this.saveTimer) clearTimeout(this.saveTimer);
            let self = this;
            this.saveTimer = setTimeout(function(){
                self.saveTimer = false;
                let s_data = self.getStoredData();
                localStorage.myStorage = JSON.stringify(s_data);
            },1000)
        },

        proxyParameter: function(object, base){
            let i;
            let clone = {};

            return new Proxy(object, {
                get: function(target, name, receiver) {
                    if (name == 'shallow' || name == 'flatten') {
                        return function(){ return target; };
                    }
                    else if (name == 'flat') return target;

                    if (!Reflect.has(target, name))
                        return undefined;

                    let rval = Reflect.get(target, name, receiver);
                    if (typeof(rval) == 'object' && rval !== null)
                        return base.proxyParameter(rval, base);
                    return rval;
                },
                set: function(target, name, value, receiver) {
                    object[name] = value;
                    base.saveStoredData();
                    return true;
                },
                deleteProperty: function(target, name) {
                    if (Array.isArray(object) && name == object.length - 1)
                        object.splice(-1);
                    else
                        delete object[name];
                    base.saveStoredData();
                    return true;
                }
            });
        },
    }, {
        get: function(target, name, receiver) {
            if (name == "default") {
                return function(newName, defaultVal) {
                    let val = receiver[newName];
                    if (typeof(val) == 'undefined')
                    {
                        receiver[newName] = defaultVal;
                        val = receiver[newName]; // potentially a proxy rather than actually defaultVal
                    }
                    return val;
                }
            }           
            let s_data = target.getStoredData();


            let val;
            if (typeof(s_data[name]) == 'undefined') return undefined;
            val = s_data[name];

            if (typeof(val) != 'object')
                return val;

            return target.proxyParameter(val, target);
        },

        set: function(target, name, value, receiver) {
            let s_data = target.getStoredData();
            if (s_data === value) return;
            s_data[name] = value;
            target.saveStoredData();
            return true;
        },
        deleteProperty: function(target, name) {
            let s_data = target.getStoredData();
            delete s_data[name];
            target.saveStoredData();
        }
    });
