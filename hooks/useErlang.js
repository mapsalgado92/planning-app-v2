import { useState } from "react"

const useErlang = () => {
  const [interval, setInterval] = useState(900)

  const [out, setOut] = useState({
    requirements: [],
    results: [],
  })

  const updateInterval = (newInterval) => {
    setInterval(newInterval)
  }
  /**
   *
   * @param {Float} vol (Number of received contacts in inteval)
   * @param {Integer} n (Number of agents/lines)
   * @param {Integer} aht (Average Handling Time in seconds)
   * @param {Object} targets ({sl, tt, occ, asa}) (optional)
   * @returns {Object} {
      volumes: vol,
      agents: n,
      aht: aht,
      sl: sl,
      asa: asa,
      occupancy: occ,
      acceptable,
      message,
    }
   */
  const calculateErlang = (vol, n, aht, targets, shrink) => {
    const powOverFact = (pow, exp, fact) => {
      let prod = 1
      let nExp = exp
      let nFact = fact
      while (nExp > 0 || nFact > 1) {
        //Calc Stage Prod
        if (nExp === 0) {
          prod *= 1 / nFact
        } else if (nExp > 1) {
          prod *= pow / nFact
        }

        //Decrement NFACT & NEXP
        nExp--
        nFact--

        //Adjust NFACT & NEXP
        if (nExp < 0) {
          nExp = 0
        }
        if (nFact < 1) {
          nFact = 1
        }
      }

      return prod
    }

    if (n === 0 || vol === 0) {
      return null
    }

    let a = (vol * aht) / interval

    console.log("A", a)

    let x = powOverFact(a, n, n) * (n / (n - a))

    console.log("X", x)

    let y = 0

    for (let i = 0; i < n; i++) {
      y += powOverFact(a, i, i)
    }

    console.log("Y", y)

    let pw = x / (y + x)

    console.log("PW", pw)

    let sl = 1 - pw * Math.exp((-(n - a) * targets.tt) / aht)

    if (sl < 0) {
      sl = 0
    }

    console.log("SL", sl)

    let occ = a / n

    if (occ > 1) {
      occ = 1
    }

    console.log("Occ", occ)

    let asa = (pw * aht) / (n - a)

    if (asa < 0) {
      asa = null
    }

    console.log("ASA", asa)

    let acceptable = true
    let message = "Acceptable"

    if (targets.sl && sl < targets.sl) {
      acceptable = false
      message = "SL Target not Met"
    } else if (targets.occ && occ > targets.occ) {
      acceptable = false
      message = "Occupancy Target not Met"
    } else if (targets.asa && asa > targets.asa) {
      acceptable = false
      message = "ASA Target not Met"
    }

    console.log(message)

    return {
      volumes: vol,
      agents: shrink ? n / (1 - shrink) : n,
      aht: aht,
      sl: sl,
      asa: asa,
      occupancy: occ,
      acceptable,
      message,
    }
  }
  /**
   *
   * @param {Float} vol (Number of received contacts in inteval)
   * @param {Integer} aht (Average Handling Time in seconds)
   * @param {Float} shrink (0 >= shrink > 1 , Shrinkage applied to requirement)
   * @param {Object} targets ({sl, tt, occ, asa})
   * @returns {Object} {
      volumes: vol,
      agents: n,
      aht: aht,
      sl: sl,
      asa: asa,
      occupancy: occ,
      acceptable,
      message,
    }
   */
  const getRequired = (vol, aht, shrink, targets) => {
    if (!vol) {
      return null
    }

    let firstEstimate = Math.round((vol * aht) / interval) + 1

    let required = {}

    for (let n = firstEstimate; n < 1000; n++) {
      required = calculateErlang(vol, n, aht, targets, shrink)

      if (required.acceptable) {
        break
      } else {
        console.log("For ", n, " -> ", required.message)
      }
    }

    return required
  }

  const generateResults = ({ distros, staffing, vol, aht, abs, aux }) => {}

  const generateRequirements = ({
    distros,
    vol,
    aht,
    targets,
    abs,
    off,
    aux,
    absFromTotal,
  }) => {
    let output = distros.map((entry) => {
      let usedAux = entry.auxDist ? entry.auxDist : aux
      let usedAbs = absFromTotal ? abs : 1 - abs * (1 - off)

      let scheduledShrink =
        1 - ((1 - usedAux) * (1 - usedAbs - off)) / (1 - off)

      let totalShrink = 1 - (1 - usedAux) * (1 - usedAbs - off)

      return {
        ...entry,
        scheduled: getRequired(
          entry.vDist * vol,
          entry.ahtDist * aht,
          scheduledShrink,
          targets
        ),
        total: getRequired(
          entry.vDist * vol,
          entry.ahtDist * aht,
          totalShrink,
          targets
        ),
      }
    })

    setOut({ ...out, requirements: output })

    return output
  }

  return {
    updateInterval,
    calculateErlang,
    getRequired,
    generateRequirements,
    out,
  }
}

export default useErlang
