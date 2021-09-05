/* global BigInt */

import _, { forEach } from 'lodash';
import bodyParts from "./body-parts.json";
import binarytraits from "./traitmapping.json";
import fetch from 'node-fetch';
import { parse } from 'json2csv';

const observerConfig = { attributes: false, childList: true, subtree: true };
const colorMap = {
	"plant": "rgb(108, 192, 0)",
	"reptile": "rgb(200, 138, 224)",
	"beast": "rgb(255, 184, 18)",
	"aquatic": "rgb(0, 184, 206)",
	"bird": "rgb(255, 139, 189)",
	"bug": "rgb(255, 83, 65)"
}
const classGeneMap = { "0000": "beast", "0001": "bug", "0010": "bird", "0011": "plant", "0100": "aquatic", "0101": "reptile", "1000": "???", "1001": "???", "1010": "???" };
const typeOrder = { "patternColor": 1, "eyes": 2, "mouth": 3, "ears": 4, "horn": 5, "back": 6, "tail": 7 };
const geneColorMap = {
	"0000": { "0010": "ffec51", "0011": "ffa12a", "0100": "f0c66e", "0110": "60afce" },
	"0001": { "0010": "ff7183", "0011": "ff6d61", "0100": "f74e4e", },
	"0010": { "0010": "ff9ab8", "0011": "ffb4bb", "0100": "ff778e" },
	"0011": { "0010": "ccef5e", "0011": "efd636", "0100": "c5ffd9" },
	"0100": { "0010": "4cffdf", "0011": "2de8f2", "0100": "759edb", "0110": "ff5a71" },
	"0101": { "0010": "fdbcff", "0011": "ef93ff", "0100": "f5e1ff", "0110": "43e27d" },
	//nut hidden_1
	"1000": { "0010": "D9D9D9", "0011": "D9D9D9", "0100": "D9D9D9", "0110": "D9D9D9" },
	//star hidden_2
	"1001": { "0010": "D9D9D9", "0011": "D9D9D9", "0100": "D9D9D9", "0110": "D9D9D9" },
	//moon hidden_3
	"1010": { "0010": "D9D9D9", "0011": "D9D9D9", "0100": "D9D9D9", "0110": "D9D9D9" }
};
const PROBABILITIES = { d: 0.375, r1: 0.09375, r2: 0.03125 };
const parts = ["eyes", "mouth", "ears", "horn", "back", "tail"];
const MAX_QUALITY = 6 * (PROBABILITIES.d + PROBABILITIES.r1 + PROBABILITIES.r2);
const MAX_RUN_RETRIES = 30;
const OPTIONS_MAP = { "class": "classes", "part": "parts", "bodyShape": "bodyShapes", "stage": "stages", "mystic": "numMystic" };
const SEARCH_PARAMS = ["class", "stage", "breedCount", "mystic", "pureness", "region", "title", "part", "bodyShape", "hp", "speed", "skill", "morale"];
var axies = {}, totalAxies = 0, axiesList = [];
var bodyPartsMap = {};

export var convert = function (data)
{

	const fields = ['id',
		'class',
		'name',
		'class',
		'stage',
		'breedCount',
		{ value: 'auction.currentPriceUSD', label: 'price' },
		{ value: 'traits.eyes.d.name', label: "D-EYES" },
		{ value: 'traits.eyes.r1.name', label: "R1-EYES" },
		{ value: 'traits.eyes.r2.name', label: "R2-EYES" },
		{ value: 'traits.ears.d.name', label: "D-Ears" },
		{ value: 'traits.ears.r1.name', label: "R1-Ears" },
		{ value: 'traits.ears.r2.name', label: "R2-Ears" },
		{ value: 'traits.back.d.name', label: "D-Back" },
		{ value: 'traits.back.r1.name', label: "R1-Back" },
		{ value: 'traits.back.r2.name', label: "R2-Back" },
		{ value: 'traits.mouth.d.name', label: "D-Mouth" },
		{ value: 'traits.mouth.r1.name', label: "R1-Mouth" },
		{ value: 'traits.mouth.r2.name', label: "R2-Mouth" },
		{ value: 'traits.horn.d.name', label: "D-Horn" },
		{ value: 'traits.horn.r1.name', label: "R1-Horn" },
		{ value: 'traits.horn.r2.name', label: "R2-Horn" },
		{ value: 'traits.tail.d.name', label: "D-Tail" },
		{ value: 'traits.tail.r1.name', label: "R1-Tail" },
		{ value: 'traits.tail.r2.name', label: "R2-Tail" },
		{ value: 'stats.hp', label: "Health" },
		{ value: 'stats.skill', label: "Skill" },
		{ value: 'stats.morale', label: "Morale" },
		{ value: 'stats.speed', label: "Speed" },
	];
	const opts = { fields };
	var csv = parse(data, opts);
	// Lodash, currently included vi©a a script, is required for this line to work
	var downloadLink = document.createElement("a");
	var blob = new Blob(["\ufeff", csv]);
	var url = URL.createObjectURL(blob);
	downloadLink.href = url;
	downloadLink.text = "click"
	downloadLink.download = "DataDump.csv";  //Name the file here
	document.body.appendChild(downloadLink);
	downloadLink.click();
	downloadLink.remove();
	return csv;
	// var xls = json2xls(data);
	// fs.writeFileSync(filename, xls, 'binary', (err) =>
	// {
	//     if (err)
	//     {
	//         console.log("writeFileSync :", err);
	//     }
	//     console.log(filename + " file is saved!");
	// });
}

function flatten(data)
{
	var result = {};
	function recurse(cur, prop)
	{
		if (Object(cur) !== cur)
		{
			result[prop] = cur;
		} else if (Array.isArray(cur))
		{
			for (var i = 0, l = cur.length; i < l; i++)
			{
				recurse(cur[i], prop + "/" + i + "/");
			}
			if (l == 0)
				result[prop] = [];
		} else
		{
			var isEmpty = true;
			for (var p in cur)
			{
				isEmpty = false;
				recurse(cur[p], prop ? prop + "." + p : p);
			}
			if (isEmpty && prop)
				result[prop] = {};
		}
	}
	recurse(data, "");
	return result;
}




export async function getAxieBriefListTotal(address, page, sort, auctionType, criteria, bodyParts)
{
	//Assume we are at 24 axies per page
	if (page < 1) page = 1;
	let from = (page - 1) * 100;
	let formattedAddress = address;
	if (formattedAddress != null)
	{
		formattedAddress = "\"" + address + "\"";
	}

	return await fetch("https://axieinfinity.com/graphql-server-v2/graphql?r=freak", {
		"headers": { "content-type": "application/json" },
		"body": "{\"operationName\":\"GetAxieBriefList\",\"variables\":{\"from\":" + from + ",\"size\":100,\"sort\":\"" + sort + "\",\"auctionType\":\"" + auctionType + "\",\"owner\":" + formattedAddress + ",\"criteria\":" + JSON.stringify(criteria) + "},\"query\":\"query GetAxieBriefList($auctionType: AuctionType, $criteria: AxieSearchCriteria, $from: Int, $sort: SortBy, $size: Int, $owner: String) {\\n  axies(auctionType: $auctionType, criteria: $criteria, from: $from, sort: $sort, size: $size, owner: $owner) {\\n    total\\n    results {\\n      ...AxieBrief\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment AxieBrief on Axie {\\n  id\\n  genes\\n  owner\\n  name\\n  stage\\n  class\\n  breedCount\\n  image\\n  title\\n  stats {\\n    ...AxieStats\\n    __typename\\n  }\\n  battleInfo {\\n    banned\\n    __typename\\n  }\\n  auction {\\n    currentPrice\\n    currentPriceUSD\\n    __typename\\n  }\\n  parts {\\n    id\\n    name\\n    class\\n    type\\n    specialGenes\\n    __typename\\n  }\\n  __typename\\n}\\nfragment AxieStats on AxieStats {\\n  hp\\n  speed\\n  skill\\n  morale\\n  __typename\\n}\\n\\n\"}",
		"method": "POST"
	})
		.then(response =>
		{
			return response.json();
		}).then(result =>
		{
			totalAxies = result.data.axies.total;
			return totalAxies;
		});

}


export async function getAxieBriefList(address, page, sort, auctionType, criteria, bp)
{
	//Assume we are at 24 axies per page
	if (page < 1) page = 1;
	let from = (page - 1) * 100;
	let formattedAddress = address;
	if (formattedAddress != null)
	{
		formattedAddress = "\"" + address + "\"";
	}
	var inc=0;
	bodyPartsMap = await getBodyParts();
	let r = await fetch("https://axieinfinity.com/graphql-server-v2/graphql?r=freak", {
		"headers": { "content-type": "application/json" },
		"body": "{\"operationName\":\"GetAxieBriefList\",\"variables\":{\"from\":" + from + ",\"size\":100,\"sort\":\"" + sort + "\",\"auctionType\":\"" + auctionType + "\",\"owner\":" + formattedAddress + ",\"criteria\":" + JSON.stringify(criteria) + "},\"query\":\"query GetAxieBriefList($auctionType: AuctionType, $criteria: AxieSearchCriteria, $from: Int, $sort: SortBy, $size: Int, $owner: String) {\\n  axies(auctionType: $auctionType, criteria: $criteria, from: $from, sort: $sort, size: $size, owner: $owner) {\\n    total\\n    results {\\n      ...AxieBrief\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment AxieBrief on Axie {\\n  id\\n  genes\\n  owner\\n  name\\n  stage\\n  class\\n  breedCount\\n  image\\n  title\\n  stats {\\n    ...AxieStats\\n    __typename\\n  }\\n  battleInfo {\\n    banned\\n    __typename\\n  }\\n  auction {\\n    currentPrice\\n    currentPriceUSD\\n    __typename\\n  }\\n  parts {\\n    id\\n    name\\n    class\\n    type\\n    specialGenes\\n    __typename\\n  }\\n  __typename\\n}\\nfragment AxieStats on AxieStats {\\n  hp\\n  speed\\n  skill\\n  morale\\n  __typename\\n}\\n\\n\"}",
		"method": "POST"
	})
		.then(response =>
		{
			return response.json();
		}).then(result =>
		{
			let results = result.data.axies.results, flattenAxiesaxies = [], flattenAxies = [];
			for (let i = 0; i < results.length; i++)
			{
				let axie = results[i];
				let id = axie.id;
				axies[id] = axie;
				if (axie.stage > 2)
				{
					axies[id].genes = genesToBin(BigInt(axies[id].genes));
					let traits = getTraits(axies[id].genes);
					let qp = getQualityAndPureness(traits, axies[id].class?.toLowerCase());
					axies[id].traits = traits;
					axies[id].quality = qp.quality;
					axies[id].pureness = qp.pureness;
				}
				inc++;
			}
			results.forEach(e =>
			{
				flattenAxies.push(flatten(e));
			});
			console.log(JSON.stringify(flattenAxies.slice(2)));
			return flattenAxies;
		})
		.catch(error =>
		{
			console.log(error,inc);
		});
	return r;
}
function genesToBin(genes)
{
	var genesString = genes.toString(2);
	genesString = strMul("0", 256 - genesString.length) + genesString
	return genesString;
}
function getTraits(genes)
{
	var groups = [genes.slice(0, 32), genes.slice(32, 64), genes.slice(64, 96), genes.slice(96, 128), genes.slice(128, 160), genes.slice(160, 192), genes.slice(192, 224), genes.slice(224, 256)];
	let cls = getClassFromGroup(groups[0]);
	let region = getRegionFromGroup(groups[0]);
	let pattern = getPatternsFromGroup(groups[1]);
	let color = getColorsFromGroup(groups[1], groups[0].slice(0, 4));
	let eyes = getPartsFromGroup("eyes", groups[2], region);
	let mouth = getPartsFromGroup("mouth", groups[3], region);
	let ears = getPartsFromGroup("ears", groups[4], region);
	let horn = getPartsFromGroup("horn", groups[5], region);
	let back = getPartsFromGroup("back", groups[6], region);
	let tail = getPartsFromGroup("tail", groups[7], region);
	return { cls: cls, region: region, pattern: pattern, color: color, eyes: eyes, mouth: mouth, ears: ears, horn: horn, back: back, tail: tail };
}
const regionGeneMap = { "00000": "global", "00001": "japan" };
function getRegionFromGroup(group)
{
	let regionBin = group.slice(8, 13);
	if (regionBin in regionGeneMap)
	{
		return regionGeneMap[regionBin];
	}
	return "Unknown Region";
}

function getClassFromGroup(group)
{
	let bin = group.slice(0, 4);
	if (!(bin in classGeneMap))
	{
		return "Unknown Class";
	}
	return classGeneMap[bin];
}

function getPatternsFromGroup(group)
{
	//patterns could be 6 bits. use 4 for now
	return { d: group.slice(2, 8), r1: group.slice(8, 14), r2: group.slice(14, 20) };
}

function getColor(bin, cls)
{
	let color;
	if (bin == "0000")
	{
		color = "ffffff";
	} else if (bin == "0001")
	{
		color = "7a6767";
	} else
	{
		color = geneColorMap[cls][bin];
	}
	return color;
}

function getColorsFromGroup(group, cls)
{
	return { d: getColor(group.slice(20, 24), cls), r1: getColor(group.slice(24, 28), cls), r2: getColor(group.slice(28, 32), cls) };
}

//hack. key: part name + " " + part type
var partsClassMap = {};
function getPartName(cls, part, region, binary, skinBinary = "00")
{
	let trait;
	if (binary in binarytraits[cls][part])
	{
		if (skinBinary == "11")
		{
			trait = binarytraits[cls][part][binary]["mystic"];
		} else if (skinBinary == "10")
		{
			trait = binarytraits[cls][part][binary]["xmas"];
		} else if (region in binarytraits[cls][part][binary])
		{
			trait = binarytraits[cls][part][binary][region];
		} else if ("global" in binarytraits[cls][part][binary])
		{
			trait = binarytraits[cls][part][binary]["global"];
		} else
		{
			trait = "UNKNOWN Regional " + cls + " " + part;
		}
	} else
	{
		trait = "UNKNOWN " + cls + " " + part;
	}
	//return part + "-" + trait.toLowerCase().replace(/\s/g, "-");
	partsClassMap[trait + " " + part] = cls;
	return trait;
}

function getPartsFromGroup(part, group, region,)
{
	let skinBinary = group.slice(0, 2);
	let mystic = skinBinary == "11";
	let dClass = classGeneMap[group.slice(2, 6)];
	let dBin = group.slice(6, 12);
	let dName = getPartName(dClass, part, region, dBin, skinBinary);

	let r1Class = classGeneMap[group.slice(12, 16)];
	let r1Bin = group.slice(16, 22);
	let r1Name = getPartName(r1Class, part, region, r1Bin);

	let r2Class = classGeneMap[group.slice(22, 26)];
	let r2Bin = group.slice(26, 32);
	let r2Name = getPartName(r2Class, part, region, r2Bin);

	return { d: getPartFromName(part, dName), r1: getPartFromName(part, r1Name), r2: getPartFromName(part, r2Name), mystic: mystic };
}
function getPartFromName(traitType, partName)
{
	let traitId = traitType.toLowerCase() + "-" + partName.toLowerCase().replace(/\s/g, "-").replace(/[\?'\.]/g, "");
	var part =bodyPartsMap[traitId];
	return part;
}

export async function getBodyParts()
{

	console.log("Failed to get body parts from the API");
	//API is unreliable. fall back to hard-coded local copy.
	let parts = bodyParts;
	for (let i in parts)
	{
		bodyPartsMap[parts[i].partId] = parts[i];
	}

	return bodyPartsMap;
}

function getQualityAndPureness(traits, cls)
{
	let quality = 0;
	let dPureness = 0;
	for (let i in parts)
	{
		if (traits[parts[i]].d.class == cls)
		{
			quality += PROBABILITIES.d;
			dPureness++;
		}
		if (traits[parts[i]].r1.class == cls)
		{
			quality += PROBABILITIES.r1;
		}
		if (traits[parts[i]].r2.class == cls)
		{
			quality += PROBABILITIES.r2;
		}
	}
	return { quality: quality / MAX_QUALITY, pureness: dPureness };
}
function strMul(str, num)
{
	var s = "";
	for (var i = 0; i < num; i++)
	{
		s += str;
	}
	return s;
}

function getAxieInfoMarket(id)
{
	fetch("https://axieinfinity.com/graphql-server-v2/graphql?r=freak", { "headers": { "content-type": "application/json" }, "body": "{\"operationName\":\"GetAxieDetail\",\"variables\":{\"axieId\":\"" + parseInt(id) + "\"},\"query\":\"query GetAxieDetail($axieId: ID!) {\\n  axie(axieId: $axieId) {\\n    ...AxieDetail\\n    __typename\\n  }\\n}\\n\\nfragment AxieDetail on Axie {\\n  id\\n  name\\n  genes\\n  owner\\n  birthDate\\n  bodyShape\\n  class\\n  sireId\\n  sireClass\\n  matronId\\n  matronClass\\n  stage\\n  title\\n  breedCount\\n  level\\n  figure {\\n    atlas\\n    model\\n    image\\n    __typename\\n  }\\n  parts {\\n    ...AxiePart\\n    __typename\\n  }\\n  stats {\\n    ...AxieStats\\n    __typename\\n  }\\n  auction {\\n    ...AxieAuction\\n    __typename\\n  }\\n  ownerProfile {\\n    name\\n    __typename\\n  }\\n  children {\\n    id\\n    name\\n    class\\n    image\\n    title\\n    stage\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment AxiePart on AxiePart {\\n  id\\n  name\\n  class\\n  type\\n  stage\\n  abilities {\\n    ...AxieCardAbility\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment AxieCardAbility on AxieCardAbility {\\n  id\\n  name\\n  attack\\n  defense\\n  energy\\n  description\\n  backgroundUrl\\n  effectIconUrl\\n  __typename\\n}\\n\\nfragment AxieStats on AxieStats {\\n  hp\\n  speed\\n  skill\\n  morale\\n  __typename\\n}\\n\\nfragment AxieAuction on Auction {\\n  startingPrice\\n  endingPrice\\n  startingTimestamp\\n  endingTimestamp\\n  duration\\n  timeLeft\\n  currentPrice\\n  currentPriceUSD\\n  suggestedPrice\\n  seller\\n  listingIndex\\n  __typename\\n}\\n\"}", "method": "POST" })
		.then(response =>
		{
			response.json().then(result =>
			{
				console.log(result);
				let axie = result.data.axie;
				//axie.pendingExp = axie.battleInfo.pendingExp;
				console.log(JSON.stringify(axie));

			});
		})
		.catch(error =>
		{
			console.log(error);
		});
}

