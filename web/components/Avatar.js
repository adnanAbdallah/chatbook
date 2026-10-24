const COLORS = ['#3b5998', '#6d84b4', '#4c9e5f', '#c0504d', '#8064a2', '#d08a2c', '#2c8ca8'];

export default function Avatar({ user, size = 50, online }) {
  const initials = (user?.name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: COLORS[(user?.id || 0) % COLORS.length],
      }}
    >
      {initials}
      {online !== undefined && <span className={`dot ${online ? 'on' : ''}`} />}
    </span>
  );
}
