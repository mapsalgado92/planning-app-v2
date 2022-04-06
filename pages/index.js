import Head from "next/head"

export default function Home({ isConnected }) {
	return (
		<>
			<Head>
				<title>Planning App | Home</title>
			</Head>
			<div className="mt-auto mb-auto">
				<div className="columns">
					<div className="column is-two-fifths has-text-centered mx-auto pb-6 pt-4">
						<h1 className="is-size-1">{"<Planning App 2._/>"}</h1>
						<h3 className="has-text-danger is-size-3">Unle$Hed</h3>
					</div>
				</div>
			</div>
		</>
	)
}
