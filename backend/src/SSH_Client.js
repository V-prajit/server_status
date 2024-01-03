const { Pool } = require('pg');
const { Client } = require("ssh2");
require('dotenv').config();
const fetchCpuUsage = require('./system_stats/Cpu_stats');
const fetchMemoryUsage = require('./system_stats/Memory_stats');

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

const getSystemsData = async () => {
    const query = 'SELECT * FROM machines';
    try {
        const res = await pool.query(query);
        return res.rows;
    } catch (err){
        console.error(err);
        return [];
    }
};

const createsshClient = (system) => {
    const sshClient = new Client();
    sshClient.on("ready", () => {
        fetchCpuUsage(sshClient, system);
        fetchMemoryUsage(sshClient, system);
    }).on('error', (err) => {
        console.error('SSH Client Error:', err);
    }).connect({
        host: system.host,
        port: system.port || 22, // Default to port 22 if not specified
        username: system.username,
        password: system.password
    });
    return sshClient;
};

const monitorAllSystems = async () => {
    const systems = await getSystemsData(); // Retrieve systems from the database
    systems.forEach(system => {
        createsshClient(system); // Create an SSH client for each system
    });
};



module.exports = monitorAllSystems;