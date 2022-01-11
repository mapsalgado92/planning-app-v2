import EntriyForm from "./EntryForm"

const EntriesModal = ({ active, toggle, selection, week }) => {
  return (
    <div className={`modal ${active ? "is-active" : ""}`}>
      <div className="modal-background"></div>
      {selection.get("capPlan") && week && (
        <div className="modal-card" style={{ minWidth: "80vw" }}>
          <header className="modal-card-head  py-2">
            <p className="modal-card-title ">
              <span className="tag is-primary is-medium">
                {week.code + " - " + week.firstDate.split("T")[0]}
              </span>
              <span className="tag is-light is-medium">
                {selection.get("capPlan").name}
              </span>
            </p>

            <button
              className="delete"
              onClick={toggle}
              aria-label="close"
            ></button>
          </header>
          <section className="modal-card-body pb-0 pt-2">
            <div>
              {active && selection.get("capPlan") && week ? (
                <EntriyForm selection={selection} week={week} />
              ) : (
                <h3>loading</h3>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default EntriesModal
