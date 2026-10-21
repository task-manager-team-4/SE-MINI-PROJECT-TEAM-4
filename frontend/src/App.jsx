
import { useState } from 'react'
import './App.css'

const sampleTasks = [
  {
    id: 1,
    title: 'Complete project documentation',
    description: 'Review the SRS and SAD documents.',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-10-22',
    owner: 'You',
  },
  {
    id: 2,
    title: 'Review frontend implementation',
    description: 'Check the task manager interface.',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2026-10-24',
    owner: 'You',
  },
  {
    id: 3,
    title: 'Prepare Sprint 1 demo',
    description: 'Verify the main task management workflow.',
    priority: 'Low',
    status: 'Pending',
    dueDate: '2026-10-23',
    owner: 'You',
  },
]

function App() {
  const [tasks] = useState(sampleTasks)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const visibleTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <main className="task-page">
      <header className="task-header">
        <div>
          <p className="eyebrow">TEAM 4 · TASK MANAGER</p>
          <h1>My Tasks</h1>
          <p className="subtitle">
            View and keep track of the tasks available to you.
          </p>
        </div>
        <span className="user-label">Demo User</span>
      </header>

      <section className="task-summary">
        <div className="summary-card">
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
        </div>
        <div className="summary-card">
          <span>In progress</span>
          <strong>
            {tasks.filter((task) => task.status === 'In Progress').length}
          </strong>
        </div>
        <div className="summary-card">
          <span>Pending</span>
          <strong>
            {tasks.filter((task) => task.status === 'Pending').length}
          </strong>
        </div>
      </section>

      <section className="task-panel">
        <div className="panel-heading">
          <div>
            <h2>Task list</h2>
            <p>Tasks displayed in this prototype</p>
          </div>
          <span className="task-count">
            {visibleTasks.length} tasks
          </span>
        </div>

        <div className="task-controls">
          <input
            type="search"
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter tasks by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {visibleTasks.length > 0 ? (
          <div className="task-list">
            {visibleTasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-top">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>
                  <span
                    className={`priority priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="task-meta">
                  <span>
                    <strong>Status:</strong> {task.status}
                  </span>
                  <span>
                    <strong>Due:</strong> {task.dueDate}
                  </span>
                  <span>
                    <strong>Assigned to:</strong> {task.owner}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No tasks match your search or selected status.
          </p>
        )}
      </section>

      <footer className="task-footer">
        Prototype for Issue #4 — View Authorized Tasks
      </footer>
    </main>
  )
}

export default App
