const { app } = require("@azure/functions");
const { getContainer } = require("../cosmosClient");

app.http("updateRecord", {
    methods: ["PUT"],
    authLevel: "anonymous",
    route: "records/{id}",
    handler: async (request, context) => {
        try {
            const id = request.params.id;
            const body = await request.json();
            const { studentName, date, status } = body;

            if (!studentName || !date || !status) {
                return {
                    status: 400,
                    jsonBody: { error: "studentName, date, and status are required" }
                };
            }

            const container = await getContainer();

            // Read the existing record to get its partition key
            const { resource: existing } = await container.item(id, studentName).read();

            if (!existing) {
                return { status: 404, jsonBody: { error: "Record not found" } };
            }

            // If the student name changed, we need to delete the old and create new
            // (Cosmos DB doesn't allow changing partition key)
            if (existing.studentName !== studentName) {
                await container.item(id, existing.studentName).delete();
                const newRecord = { id, studentName, date, status, createdAt: existing.createdAt };
                const { resource } = await container.items.create(newRecord);
                return {
                    status: 200,
                    jsonBody: resource,
                    headers: { "Content-Type": "application/json" }
                };
            }

            // Same partition key — just replace
            const updated = { ...existing, studentName, date, status };
            const { resource } = await container.item(id, studentName).replace(updated);

            return {
                status: 200,
                jsonBody: resource,
                headers: { "Content-Type": "application/json" }
            };
        } catch (error) {
            context.log("Error updating record:", error.message);
            return {
                status: 500,
                jsonBody: { error: "Failed to update record: " + error.message }
            };
        }
    }
});
