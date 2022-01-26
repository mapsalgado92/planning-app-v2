/**
 * yArray: ["00:00", ...]
 * yField: "interval"
 *
 * xArray: [{label: "SUN", value: 1},...]
 * xField: "weekday"
 */
const Heatmap = ({ xArray, yArray, data, value }) => {
	return (
		<table className="table">
			<thead>
				<tr>
					<th>#</th>
					{xArray && xArray.map((item) => <th>{item.label}</th>)}
				</tr>
			</thead>
			<tbody>
				{yArray &&
					yArray.map((yItem, yIndex) => (
						<tr>
							<th>{yItem}</th>
							{xArray &&
								xArray.map((xItem, xIndex) => {
									return (
										<td>
											{Math.round(
												parseFloat(
													data[yIndex + yArray.length * xIndex][value]
												) * 100
											) / 100 || "#"}
										</td>
									)
								})}
						</tr>
					))}
			</tbody>
		</table>
	)
}

export default Heatmap
