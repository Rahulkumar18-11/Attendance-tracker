const { app } = require("@azure/functions");
const { getContainer } = require("../cosmosClient");

app.http("createRecord", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "records",
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { studentName, date, status } = body;

            if (!studentName || !date || !status) {
                return {
                    status: 400,
                    jsonBody: { error: "studentName, date, and status are required" }
                };
            }

            const record = {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
                studentName,
                date,
                status,
                createdAt: new Date().toISOString()
            };

            const container = await getContainer();
            const { resource } = await container.items.create(record);

            return {
                status: 201,
                jsonBody: resource,
                headers: { "Content-Type": "application/json" }
            };
        } catch (error) {
            context.log("Error creating record:", error.message);
            return {
                status: 500,
                jsonBody: { error: "Failed to create record: " + error.message }
            };
        }
    }
});
