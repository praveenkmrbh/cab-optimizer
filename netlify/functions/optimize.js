const { parse } = require('csv-parse');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const API_KEY = process.env.GRAPHHOPPER_KEY;
  const { csv, office } = JSON.parse(event.body);
  
  // Process CSV
  const employees = await new Promise((resolve) => {
    const results = [];
    parse(csv, { columns: true })
      .on('data', (row) => results.push({
        name: row.name,
        lat: parseFloat(row.lat),
        lon: parseFloat(row.lon)
      }))
      .on('end', () => resolve(results));
  });

  // Get travel times
  const employeesWithTimes = await Promise.all(employees.map(async emp => {
    const time = await getTravelTime(office, emp, API_KEY);
    return { ...emp, time };
  }));

  // Grouping logic
  const roster = [];
  const sortedEmployees = employeesWithTimes.sort((a, b) => b.time - a.time);
  
  while (sortedEmployees.length > 0) {
    const base = sortedEmployees.shift();
    const cab = { members: [base], size: 1 };
    
    for (let i = sortedEmployees.length - 1; i >= 0; i--) {
      const detour = await calculateDetour(base, sortedEmployees[i], API_KEY);
      if (detour <= 40 && cab.size < 5) {
        cab.members.push(sortedEmployees[i]);
        cab.size++;
        sortedEmployees.splice(i, 1);
      }
    }
    
    cab.route = await optimizeRouteOrder(cab.members, API_KEY);
    roster.push(cab);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(roster)
  };
};

async function getTravelTime(origin, destination, apiKey) {
  const response = await fetch(
    `https://graphhopper.com/api/1/route?point=${origin[0]},${origin[1]}&point=${destination.lat},${destination.lon}&vehicle=car&key=${apiKey}`
  );
  const data = await response.json();
  return data.paths[0].time / 60000; // Convert ms to minutes
}
