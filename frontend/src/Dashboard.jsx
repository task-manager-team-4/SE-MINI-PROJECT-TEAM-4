
function Dashboard({ tasks = [] }) {
  const totalTasks = tasks.length;

  const pendingTasks = tasks.filter(
    (task) => task.status === 'Pending'
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'In Progress'
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === 'Completed'
  ).length;

  // Count overdue tasks that are not yet completed.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((task) => {
    if (!task.deadline || task.status === 'Completed') {
      return false;
    }

    const deadline = new Date(task.deadline);

    if (Number.isNaN(deadline.getTime())) {
      return false;
    }

    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  }).length;

  const progress = totalTasks === 0
    ? 0
    : Math.round((completedTasks / totalTasks) * 100);

  const cards = [
    {
      title: 'Total Tasks',
      count: totalTasks,
      color: '#6366f1',
    },
    {
      title: 'To Do',
      count: pendingTasks,
      color: '#64748b',
    },
    {
      title: 'In Progress',
      count: inProgressTasks,
      color: '#d97706',
    },
    {
      title: 'Completed',
      count: completedTasks,
      color: '#16a34a',
    },
    {
      title: 'Overdue',
      count: overdueTasks,
      color: '#dc2626',
    },
  ];

  return (
    <section style={styles.container}>
      <div style={styles.heading}>
        <div>
          <h2 style={styles.title}>Dashboard</h2>
          <p style={styles.subtitle}>
            Overview of your tasks and progress
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              ...styles.card,
              borderTop: `4px solid ${card.color}`,
            }}
          >
            <p style={styles.cardTitle}>{card.title}</p>
            <h3 style={styles.count}>{card.count}</h3>
          </div>
        ))}
      </div>

      <div style={styles.progressCard}>
        <div style={styles.progressHeader}>
          <div>
            <h3 style={styles.progressTitle}>Overall Progress</h3>
            <p style={styles.subtitle}>
              Completed tasks compared with total tasks
            </p>
          </div>

          <strong style={styles.percentage}>{progress}%</strong>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
        </div>

        <p style={styles.progressText}>
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </div>
    </section>
  );
}

const styles = {
  container: {
    marginBottom: '30px',
    padding: '20px',
    borderRadius: '14px',
    background: '#20232e',
    color: '#ffffff',
  },
  heading: {
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  subtitle: {
    marginTop: '6px',
    color: '#aeb4c2',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '14px',
  },
  card: {
    background: '#171a23',
    borderRadius: '10px',
    padding: '16px',
  },
  cardTitle: {
    margin: 0,
    color: '#b8bfce',
    fontSize: '14px',
  },
  count: {
    margin: '12px 0 0',
    fontSize: '30px',
  },
  progressCard: {
    marginTop: '20px',
    padding: '18px',
    background: '#171a23',
    borderRadius: '10px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  progressTitle: {
    margin: 0,
    fontSize: '18px',
  },
  percentage: {
    fontSize: '24px',
    color: '#86efac',
  },
  progressTrack: {
    width: '100%',
    height: '12px',
    background: '#343947',
    borderRadius: '20px',
    overflow: 'hidden',
    marginTop: '16px',
  },
  progressFill: {
    height: '100%',
    background: '#22c55e',
    borderRadius: '20px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    color: '#b8bfce',
    fontSize: '13px',
    marginBottom: 0,
  },
};

export default Dashboard;
