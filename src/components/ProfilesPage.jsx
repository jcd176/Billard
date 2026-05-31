// ... dans le rendu des joueurs
<div className="bg-dark-wood p-6 rounded-3xl border border-gold/30 flex items-center shadow-lg hover:border-gold transition-all">
  <div className="w-16 h-16 rounded-full bg-black border-4 border-white flex items-center justify-center text-gold font-bold text-xl">
    {player.name.substring(0, 2).toUpperCase()}
  </div>
  <div className="ml-4 flex-grow">
    <h3 className="text-2xl font-bold text-white">{player.name}</h3>
    {/* ID permanent supprimé ici pour un rendu propre */}
  </div>
</div>
