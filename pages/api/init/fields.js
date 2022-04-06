import fields from "../../../data-init/fields.json"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"

export default async function handler(req, res) {
	const { client, db } = await connectToDatabase()
	console.log(client)

	if (fields && client) {
		let response = await db
			.collection("fields")
			.insertMany(
				fields.map((field) => ({ ...field, _id: ObjectId(field._id["$oid"]) }))
			)

		res.status(200).json({
			message: `Updated Entry in Database!`,
			inserted: fields,
		})
	} else {
		//BAD REQUEST
		res.status(405).json({ message: "Method not Allowed, use POST only" })
	}
}
