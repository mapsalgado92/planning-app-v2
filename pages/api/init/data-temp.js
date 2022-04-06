import capEntries from "../../../data-init/capEntries.json"
import capPlans from "../../../data-init/capPlans.json"
import projects from "../../../data-init/projects.json"
import lobs from "../../../data-init/projects.json"
import verification from "../../../data-init/verification.json"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"

export default async function handler(req, res) {
	const { client, db } = await connectToDatabase()
	console.log(client)

	if (client) {
		await db
			.collection("capEntries")
			.insertMany(
				capEntries.map((item) => ({ ...item, _id: ObjectId(item._id["$oid"]) }))
			)

		await db
			.collection("capPlans")
			.insertMany(
				capPlans.map((item) => ({ ...item, _id: ObjectId(item._id["$oid"]) }))
			)

		await db
			.collection("projects")
			.insertMany(
				projects.map((item) => ({ ...item, _id: ObjectId(item._id["$oid"]) }))
			)

		await db
			.collection("lobs")
			.insertMany(
				lobs.map((item) => ({ ...item, _id: ObjectId(item._id["$oid"]) }))
			)

		await db
			.collection("verification")
			.insertMany(
				verification.map((item) => ({
					...item,
					_id: ObjectId(item._id["$oid"]),
				}))
			)

		res.status(200).json({
			message: `Updated Entry in Database!`,
			inserted: { fields, weeks, languages },
		})
	} else {
		//BAD REQUEST
		res.status(405).json({ message: "Method not Allowed, use POST only" })
	}
}
