const { app } = require("@azure/functions");
const { getContainer } = require("../cosmosClient");

app.http("deleteRecord", {
    methods: ["DELETE"],
    authLevel: "anonymous",
    route: "records/{id}",
    handler: async (request, context) => {
        try {
            const id = request.params.id;
            const studentName = request.query.get("studentName");

            if (!studentName) {
                return {
                    status: 400,
                    jsonBody: { error: "studentName query parameter is required" }
                };
            }

            const container = await getContainer();
            await container.item(id, studentName).delete();

            return {
                status: 200,
                jsonBody: { message: "Record deleted successfully" }
            };
        } catch (error) {
            if (error.code === 404) {
                return { status: 404, jsonBody: { error: "Record not found" } };
            }
            context.log("Error deleting record:", error.message);
            return {
                status: 500,
                jsonBody: { error: "Failed to delete record: " + error.message }
            };
        }
    }
});
