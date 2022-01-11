import Head from "next/head"
import clientPromise from "../lib/mongodb"

export default function Home({ isConnected }) {
  return (
    <>
      <Head>
        <title>Sitel Planner | Home</title>
      </Head>
      <div className="mt-auto mb-auto">
        <div className="columns">
          <div className="column is-two-fifths has-text-centered mx-auto pb-6 pt-4">
            <h1 className="is-size-1">{"<Planning App 2._/>"}</h1>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  try {
    // client.db() will be the default database passed in the MONGODB_URI
    // You can change the database by calling the client.db() function and specifying a database like:
    // const db = client.db("myDatabase");
    // Then you can execute queries against your database like so:
    // db.find({}) or any of the MongoDB Node Driver commands
    await clientPromise
    return {
      props: { isConnected: true },
    }
  } catch (e) {
    console.error(e)
    return {
      props: { isConnected: false },
    }
  }
}
