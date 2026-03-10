const { CosmosClient } = require("@azure/cosmos");

let client;
let container;

async function getContainer() {
    if (!container) {
        const endpoint = process.env.COSMOS_ENDPOINT;
        const key = process.env.COSMOS_KEY;
        const connectionString = process.env.COSMOS_CONNECTION_STRING;

        if ((!endpoint || !key) && !connectionString) {
            throw new Error("Cosmos DB credentials are not configured. Set COSMOS_ENDPOINT and COSMOS_KEY in Application Settings.");
        }
        
        if (endpoint && key) {
            client = new CosmosClient({ endpoint, key });
        } else {
            client = new CosmosClient(connectionString);
        }

        // Auto-create database and container if they don't exist
        const { database } = await client.databases.createIfNotExists({ id: "AttendanceDB" });
        const { container: newContainer } = await database.containers.createIfNotExists({
            id: "AttendanceRecords",
            partitionKey: { paths: ["/studentName"] }
        });

        container = newContainer;
    }
    return container;
}

module.exports = { getContainer };
