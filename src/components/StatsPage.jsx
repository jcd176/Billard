export default function StatsPage({ roomId }) {
  const [scores, setScores] = useState({});
  useEffect(() => {
    return onValue(ref(database, `rooms/${roomId}/scores`), (s) => setScores(s.val() || {}));
  }, [roomId]);

  const stats = Object.entries(scores).map(([name, data]) => {
    const v = data.v || 0, d = data.d || 0;
    const total = v + d;
    return { name, v, d, pct: total > 0 ? Math.round((v / total) * 100) : 0 };
  }).sort((a, b) => b.v - a.v);

  return (
    <div className="p-4">
      <h2 className="text-[#00b4d8] text-xl font-bold mb-4">Classement Général</h2>
      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="p-3">#</th><th className="p-3">Joueur</th><th className="p-3">V</th><th className="p-3">D</th><th className="p-3">%</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.name} className="border-b border-white/5">
                <td className="p-3">{i + 1}</td>
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3 text-green-500">{s.v}</td>
                <td className="p-3 text-red-500">{s.d}</td>
                <td className="p-3 text-[#dfb743]">{s.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
