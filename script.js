/* script.js
   Interactivité :
   - construit un plateau 8x8 (cases nommées a1..h8)
   - gère les boutons "Voir déplacements" sur chaque fiche de pièce
   - met en évidence les cases atteignables selon le type de pièce (modèle pédagogique,
     simplifié : pour les pièces glissantes on ne tient pas compte des blocs autres que bord)
*/

(function(){
  // utility
  const files = ['a','b','c','d','e','f','g','h'];
  function coordToIndex(file, rank){ // file char, rank number (1..8)
    const x = files.indexOf(file);
    const y = 8 - rank; // row in grid (0-based)
    return {x,y};
  }

  // create board DOM
  const boardEl = document.getElementById('board');
  const squares = {}; // map "a1" => dom
  function buildBoard(){
    boardEl.innerHTML = '';
    for(let r = 8; r>=1; r--){
      for(let f = 0; f<8; f++){
        const file = files[f];
        const coord = file + r;
        const div = document.createElement('div');
        div.className = 'square ' + (((f + r) % 2 === 0) ? 'light' : 'dark');
        div.setAttribute('data-coord', coord);
        div.setAttribute('data-file', file);
        div.setAttribute('data-rank', r);
        div.setAttribute('id', 'sq-' + coord);
        // allow keyboard focus for accessibility
        div.tabIndex = -1;
        boardEl.appendChild(div);
        squares[coord] = div;
      }
    }
  }

  // highlight helpers
  function clearHighlights(){
    Object.values(squares).forEach(sq => {
      sq.classList.remove('highlight','capture');
    });
  }

  // compute moves for each piece type (simplified, pedagogical)
  function computeMoves(piece, origin = 'd4'){ // origin default center for demo
    // origin is coordinate like 'd4'
    const file = origin[0];
    const rank = parseInt(origin[1],10);

    // helpers to test within board
    function inside(f, r){ return f >= 0 && f < 8 && r >= 1 && r <= 8; }
    function fileIndex(f){ return files.indexOf(f); }
    const fx = fileIndex(file);

    const moves = []; // {coord, type:'move'|'capture'}

    if(piece === 'king'){
      for(let dx=-1; dx<=1; dx++){
        for(let dy=-1; dy<=1; dy++){
          if(dx===0 && dy===0) continue;
          const nx = fx + dx;
          const nr = rank + dy;
          if(inside(nx, nr)) moves.push({coord: files[nx] + nr, type:'move'});
        }
      }
    } else if(piece === 'queen'){
      // combine rook + bishop
      const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      directions.forEach(dir=>{
        let nx = fx + dir[0];
        let nr = rank + dir[1];
        while(inside(nx, nr)){
          moves.push({coord: files[nx] + nr, type:'move'});
          nx += dir[0];
          nr += dir[1];
        }
      });
    } else if(piece === 'rook'){
      const directions = [[1,0],[-1,0],[0,1],[0,-1]];
      directions.forEach(dir=>{
        let nx = fx + dir[0];
        let nr = rank + dir[1];
        while(inside(nx, nr)){
          moves.push({coord: files[nx] + nr, type:'move'});
          nx += dir[0];
          nr += dir[1];
        }
      });
    } else if(piece === 'bishop'){
      const directions = [[1,1],[1,-1],[-1,1],[-1,-1]];
      directions.forEach(dir=>{
        let nx = fx + dir[0];
        let nr = rank + dir[1];
        while(inside(nx, nr)){
          moves.push({coord: files[nx] + nr, type:'move'});
          nx += dir[0];
          nr += dir[1];
        }
      });
    } else if(piece === 'knight'){
      const jumps = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
      jumps.forEach(j=>{
        const nx = fx + j[0];
        const nr = rank + j[1];
        if(inside(nx,nr)) moves.push({coord: files[nx] + nr, type:'move'});
      });
    } else if(piece === 'pawn'){
      // pedagogical: pawn is white, so it moves up (rank+)
      // from origin: 1-step forward, optionally 2 from rank 2, capture diagonals
      const forward = rank + 1;
      if(inside(fx, forward)) moves.push({coord: files[fx] + forward, type:'move'});
      if(rank === 2 && inside(fx, rank + 2)) moves.push({coord: files[fx] + (rank + 2), type:'move'});
      // captures (illustrative)
      if(inside(fx-1, forward)) moves.push({coord: files[fx-1] + forward, type:'capture'});
      if(inside(fx+1, forward)) moves.push({coord: files[fx+1] + forward, type:'capture'});
    }

    return moves;
  }

  // default demo origin positions for each piece (set so moves are visible)
  const demoOrigins = {
    king: 'd4',
    queen: 'd4',
    rook: 'd4',
    bishop: 'd4',
    knight: 'd4',
    pawn: 'd2'
  };

  // attach events to piece buttons
  function initControls(){
    document.querySelectorAll('.show-moves').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const piece = btn.getAttribute('data-piece');
        const origin = demoOrigins[piece] || 'd4';
        highlightPieceMoves(piece, origin);
        // scroll to board for clarity
        document.getElementById('board').scrollIntoView({behavior:'smooth', block:'center'});
      });
    });

    document.getElementById('clearHighlights').addEventListener('click', clearHighlights);

    // add keyboard quick keys: 1-6 to show pieces
    window.addEventListener('keydown', (ev)=>{
      if(document.activeElement && document.activeElement.tagName === 'INPUT') return;
      const map = {
        '1':'king','2':'queen','3':'rook','4':'bishop','5':'knight','6':'pawn'
      };
      if(map[ev.key]){
        document.querySelector(`.show-moves[data-piece="${map[ev.key]}"]`)?.click();
      }
    });
  }

  function highlightPieceMoves(piece, origin){
    clearHighlights();
    // mark origin
    const originEl = squares[origin];
    if(originEl) originEl.classList.add('highlight');

    const moves = computeMoves(piece, origin);
    moves.forEach(m=>{
      const el = squares[m.coord];
      if(!el) return;
      if(m.type === 'move') el.classList.add('highlight');
      else if(m.type === 'capture') el.classList.add('capture');
    });
  }

  // build UI and init
  buildBoard();
  initControls();

  // optional: place small markers on origin squares to show default positions
  Object.entries(demoOrigins).forEach(([piece, coord])=>{
    const el = squares[coord];
    if(!el) return;
    const mark = document.createElement('div');
    mark.style.position = 'absolute';
    mark.style.top='6px';
    mark.style.left='6px';
    mark.style.fontSize='11px';
    mark.style.color='rgba(0,0,0,0.18)';
    mark.textContent = piece.charAt(0).toUpperCase();
    el.style.position='relative';
    el.appendChild(mark);
  });

  // expose for debugging (optional)
  window.chessDemo = {
    computeMoves, highlightPieceMoves, clearHighlights
  };
})();
