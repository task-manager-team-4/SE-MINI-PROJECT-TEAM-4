import { useEffect, useState } from 'react'
import Dashboard from './Dashboard'
import './App.css'

const API = 'http://localhost:5000/api'
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed']
const TASK_PRIORITIES = ['Low', 'Medium', 'High']

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('taskToken') || '',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [selectedAssignees, setSelectedAssignees] = useState({})
  const [assigningTaskId, setAssigningTaskId] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('Medium')
  const [newDeadline, setNewDeadline] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  // FR-05: Edit task state
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('Medium')
  const [editDeadline, setEditDeadline] = useState('')
  const [editStatus, setEditStatus] = useState('Pending')

  // Load tasks and users
  async function loadTasks(authToken) {
    try {
      const response = await fetch(`${API}/tasks`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load tasks')
      }

      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    async function fetchInitialData() {
      try {
        const [tasksResponse, usersResponse] = await Promise.all([
          fetch(`${API}/tasks`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }),
          fetch(`${API}/tasks/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }),
        ])

        const tasksData = await tasksResponse.json()
        const usersData = await usersResponse.json()

        if (!tasksResponse.ok) {
          throw new Error(tasksData.message || 'Failed to load tasks')
        }

        if (!usersResponse.ok) {
          throw new Error(usersData.message || 'Failed to load users')
        }

        setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : [])
        setUsers(Array.isArray(usersData.users) ? usersData.users : [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      }
    }

    fetchInitialData()

    return () => controller.abort()
  }, [token])

  // Authentication
  async function handleAuth(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const endpoint = isRegistering ? 'register' : 'login'

      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      const authToken = data.token

      if (!authToken) {
        throw new Error('Authentication token was not received')
      }

      localStorage.setItem('taskToken', authToken)
      setToken(authToken)
      setEmail('')
      setPassword('')
      setMessage(
        isRegistering
          ? 'Registration successful!'
          : 'Login successful!',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('taskToken')
    setToken('')
    setTasks([])
    setUsers([])
    setError('')
    setMessage('')
    setEditingTaskId(null)
  }

  // FR-03: Create task
  async function handleCreateTask(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!newTitle.trim()) {
      setError('Task title is required')
      return
    }

    setCreatingTask(true)

    try {
      const response = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: newPriority,
          deadline: newDeadline || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task')
      }

      setNewTitle('')
      setNewDescription('')
      setNewPriority('Medium')
      setNewDeadline('')

      await loadTasks(token)
      setMessage('Task created successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingTask(false)
    }
  }

  // FR-05: Start editing a task
  function startEditing(task) {
    setEditingTaskId(task.id)
    setEditTitle(task.title || '')
    setEditDescription(task.description || '')
    setEditPriority(task.priority || 'Medium')
    setEditDeadline(
      task.deadline
        ? new Date(task.deadline).toISOString().slice(0, 10)
        : '',
    )
    setEditStatus(task.status || 'Pending')
    setError('')
    setMessage('')
  }

  function cancelEditing() {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
    setEditPriority('Medium')
    setEditDeadline('')
    setEditStatus('Pending')
  }

  // FR-05: Save edited task
  async function handleUpdateTask(event, taskId) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!editTitle.trim()) {
      setError('Task title is required')
      return
    }

    setUpdatingTaskId(taskId)

    try {
      const response = await fetch(`${API}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          deadline: editDeadline || null,
          status: editStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task')
      }

      cancelEditing()
      await loadTasks(token)
      setMessage('Task updated successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  // FR-06: Delete task
  async function handleDeleteTask(taskId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?',
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete task')
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== taskId),
      )

      setMessage('Task deleted successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  // FR-08: Update task status
  async function handleStatusChange(taskId, newStatus) {
    setError('')
    setMessage('')
    setUpdatingTaskId(taskId)

    try {
      const response = await fetch(`${API}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task status')
      }

      await loadTasks(token)
      setMessage('Task status updated successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  // FR-07: Assign task
  async function handleAssignTask(taskId) {
    const assigneeId = selectedAssignees[taskId]

    if (!assigneeId) {
      setError('Please select a user to assign this task')
      return
    }

    setError('')
    setMessage('')
    setAssigningTaskId(taskId)

    try {
      const response = await fetch(`${API}/tasks/${taskId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignee_id: assigneeId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign task')
      }

      await loadTasks(token)

      setMessage('Task assigned successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setAssigningTaskId(null)
    }
  }

  // Search and filter tasks
  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      (task.title || '').toLowerCase().includes(searchText) ||
      (task.description || '').toLowerCase().includes(searchText)

    const matchesStatus =
      statusFilter === 'All' || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Login / registration screen
  if (!token) {
    return (
      <main className="auth-container">
        <section className="auth-card">
          <h1>Task Manager</h1>
          <p>
            {isRegistering
              ? 'Create your account'
              : 'Login to manage your tasks'}
          </p>

          {error && (
            <p className="error-message">{error}</p>
          )}

          {message && (
            <p className="success-message">{message}</p>
          )}

          <form onSubmit={handleAuth}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />

            <button type="submit" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isRegistering
                  ? 'Register'
                  : 'Login'}
            </button>
          </form>

          <p className="auth-toggle">
            {isRegistering
              ? 'Already have an account?'
              : "Don't have an account?"}{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setError('')
                setMessage('')
              }}
            >
              {isRegistering ? 'Login' : 'Register'}
            </button>
          </p>
        </section>
      </main>
    )
  }

  // Main application
  return (
    <main className="app-container">
      <header className="app-header">
        <div>
          <h1>Task Manager</h1>
          <p>Organize your work and track your progress</p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      {error && (
        <p className="error-message">{error}</p>
      )}

      {message && (
        <p className="success-message">{message}</p>
      )}

      {/* FR-11: Dashboard and progress tracking */}
      <Dashboard tasks={tasks} />

      {/* Create task */}
      <section className="task-panel">
        <div className="panel-heading">
          <div>
            <h2>Create a task</h2>
            <p>Add a new task to your account</p>
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="task-form">
          <div className="form-group">
            <label htmlFor="newTitle">Task title</label>
            <input
              id="newTitle"
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newDescription">Description</label>
            <textarea
              id="newDescription"
              value={newDescription}
              onChange={(event) =>
                setNewDescription(event.target.value)
              }
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="newPriority">Priority</label>
              <select
                id="newPriority"
                value={newPriority}
                onChange={(event) =>
                  setNewPriority(event.target.value)
                }
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="newDeadline">Deadline</label>
              <input
                id="newDeadline"
                type="date"
                value={newDeadline}
                onChange={(event) =>
                  setNewDeadline(event.target.value)
                }
              />
            </div>
          </div>

          <button type="submit" disabled={creatingTask}>
            {creatingTask ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </section>

      {/* Task list */}
      <section className="task-panel">
        <div className="panel-heading">
          <div>
            <h2>Your tasks</h2>
            <p>View and manage your tasks</p>
          </div>
        </div>

        <div className="task-filters">
          <div className="form-group">
            <label htmlFor="search">Search tasks</label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="statusFilter">Filter by status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All statuses</option>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="loading-message">Loading tasks...</p>
        ) : filteredTasks.length > 0 ? (
          <div className="task-list">
            {filteredTasks.map((task) => {
              const isEditing = editingTaskId === task.id

              return (
                <article className="task-card" key={task.id}>
                  {isEditing ? (
                    <form
                      className="edit-task-form"
                      onSubmit={(event) =>
                        handleUpdateTask(event, task.id)
                      }
                    >
                      <h3>Edit task</h3>

                      <div className="form-group">
                        <label htmlFor={`editTitle-${task.id}`}>
                          Task title
                        </label>
                        <input
                          id={`editTitle-${task.id}`}
                          type="text"
                          value={editTitle}
                          onChange={(event) =>
                            setEditTitle(event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`editDescription-${task.id}`}>
                          Description
                        </label>
                        <textarea
                          id={`editDescription-${task.id}`}
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                          rows="3"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor={`editPriority-${task.id}`}>
                            Priority
                          </label>
                          <select
                            id={`editPriority-${task.id}`}
                            value={editPriority}
                            onChange={(event) =>
                              setEditPriority(event.target.value)
                            }
                          >
                            {TASK_PRIORITIES.map((priority) => (
                              <option
                                key={priority}
                                value={priority}
                              >
                                {priority}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`editDeadline-${task.id}`}>
                            Deadline
                          </label>
                          <input
                            id={`editDeadline-${task.id}`}
                            type="date"
                            value={editDeadline}
                            onChange={(event) =>
                              setEditDeadline(event.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`editStatus-${task.id}`}>
                          Status
                        </label>
                        <select
                          id={`editStatus-${task.id}`}
                          value={editStatus}
                          onChange={(event) =>
                            setEditStatus(event.target.value)
                          }
                        >
                          {TASK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="task-actions">
                        <button
                          type="submit"
                          disabled={updatingTaskId === task.id}
                        >
                          {updatingTaskId === task.id
                            ? 'Saving...'
                            : 'Save Changes'}
                        </button>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="task-card-header">
                        <div>
                          <h3>{task.title}</h3>
                          <p>{task.description}</p>
                        </div>

                        <span
                          className={`status-badge ${(
                            task.status || ''
                          )
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <div className="task-details">
                        <span>
                          Priority: <strong>{task.priority}</strong>
                        </span>

                        <span>
                          Deadline:{' '}
                          <strong>
                            {task.deadline
                              ? new Date(
                                  task.deadline,
                                ).toLocaleDateString()
                              : 'Not set'}
                          </strong>
                        </span>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`status-${task.id}`}>
                          Update status
                        </label>
                        <select
                          id={`status-${task.id}`}
                          value={task.status}
                          disabled={updatingTaskId === task.id}
                          onChange={(event) =>
                            handleStatusChange(
                              task.id,
                              event.target.value,
                            )
                          }
                        >
                          {TASK_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* FR-07: Assign task */}
                      <div className="assign-task-section">
                        <div className="form-group">
                          <label htmlFor={`assignee-${task.id}`}>
                            Assign to user
                          </label>
                          <select
                            id={`assignee-${task.id}`}
                            value={selectedAssignees[task.id] || ''}
                            onChange={(event) =>
                              setSelectedAssignees((previous) => ({
                                ...previous,
                                [task.id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select a user</option>
                            {users.map((user) => (
                              <option
                                key={user.id}
                                value={user.id}
                              >
                                {user.email}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={assigningTaskId === task.id}
                          onClick={() => handleAssignTask(task.id)}
                        >
                          {assigningTaskId === task.id
                            ? 'Assigning...'
                            : 'Assign Task'}
                        </button>
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="empty-state">
            {tasks.length === 0
              ? 'You have no tasks yet. Create one using the form above.'
              : 'No tasks match your search or selected status.'}
          </p>
        )}
      </section>

      <footer className="task-footer">
        Team 4 — Task Manager Application
      </footer>
    </main>
  )
}

export default App