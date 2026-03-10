const { app } = require("@azure/functions");
const { getContainer } = require("../cosmosClient");

app.http("getRecords", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "records",
    handler: async (request, context) => {
        try {
            const container = await getContainer();
            const { resources } = await container.items
                .query("SELECT * FROM c ORDER BY c.date DESC")
                .fetchAll();

            return {
                status: 200,
                jsonBody: resources,
                headers: { "Content-Type": "application/json" }
            };
        } catch (error) {
            context.log("Error fetching records:", error.message);
            return {
                status: 500,
                jsonBody: { error: "Failed to fetch records: " + error.message }
            };
        }
    }
});
