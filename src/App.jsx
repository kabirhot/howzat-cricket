import React, { useState, useEffect, useReducer } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Play, 
  RotateCcw, 
  Info, 
  Award, 
  MapPin, 
  TrendingUp, 
  CheckCircle,
  HelpCircle,
  Zap,
  Flame,
  ArrowRight,
  Sparkles,
  Undo2
} from 'lucide-react';
import { TEAMS_DATA, SCHEDULE_DATA, RULES } from './mockData';

// Ball processing logic extracted to pure function for testability
function scoreBall(state, { type, value = 0 }) {
  let isBallLegal = true;
  let runScored = 0;
  let extraScored = 0;
  let isWicket = false;
  let displayLabel = "";
  let celebrationType = null;
  let celebrationText = "";
  let nextFreeHitValue = state.freeHit;

  if (type === 'run') {
    runScored = value;
    displayLabel = value === 0 ? "0" : `${value}`;
    if (value === 4) {
      celebrationType = 'FOUR';
      celebrationText = `${state.batsmenStats[state.striker]?.name.split(" ")[0]} hits a gorgeous BOUNDARY! 🏏`;
    } else if (value === 6) {
      celebrationType = 'SIX';
      celebrationText = `${state.batsmenStats[state.striker]?.name.split(" ")[0]} clears the rope! HUGE SIX! 🚀`;
    }
    nextFreeHitValue = false;
  } else if (type === 'wide') {
    extraScored = 1;
    isBallLegal = false;
    displayLabel = "WD";
  } else if (type === 'noball') {
    runScored = value;
    extraScored = 1;
    isBallLegal = false;
    displayLabel = "NB";
    nextFreeHitValue = true;
    celebrationType = 'FREE_HIT';
    celebrationText = "NO BALL! FREE HIT NEXT! ⚡";
  } else if (type === 'noballboundary') {
    runScored = value; // 4 or 6
    extraScored = 1;
    isBallLegal = false;
    displayLabel = "NB";
    nextFreeHitValue = true;
    celebrationType = 'FREE_HIT';
    celebrationText = `NO BALL! FREE HIT NEXT! ⚡ +${value} runs!`;
    if (value === 4) {
      celebrationType = 'FOUR';
      celebrationText = `NO BALL FOUR! 🏏 FREE HIT NEXT! ⚡`;
    } else if (value === 6) {
      celebrationType = 'SIX';
      celebrationText = `NO BALL SIX! 🚀 FREE HIT NEXT! ⚡`;
    }
  } else if (type === 'wicket') {
    if (state.freeHit) {
      return { ...state, error: "Free Hit Active! Batsman cannot be out!" };
    }
    isWicket = true;
    displayLabel = "W";
    celebrationType = 'WICKET';
    celebrationText = `OUT! ${state.batsmenStats[state.striker]?.name} has to walk back! 💥`;
    nextFreeHitValue = false;
  } else if (type === 'bye') {
    // FIX: Byes with odd runs should now rotate strike
    runScored = value;
    extraScored = 0;
    isBallLegal = true; // Bye is a legal delivery
    displayLabel = `${value}B`;
  }

  const totalRunsThisBall = runScored + extraScored;
  const newRuns = state.runs + totalRunsThisBall;
  const newWickets = state.wickets + (isWicket ? 1 : 0);
  const newBalls = state.balls + (isBallLegal ? 1 : 0);

  return {
    ...state,
    runs: newRuns,
    wickets: newWickets,
    balls: newBalls,
    freeHit: nextFreeHitValue,
    currentDelivery: {
      type,
      value,
      displayLabel,
      runScored,
      extraScored,
      isWicket,
      celebrationType,
      celebrationText,
      isBallLegal
    }
  };
}

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('home');
  
  // Teams and Points Table State
  const [teams, setTeams] = useState(TEAMS_DATA);
  const [schedule, setSchedule] = useState(SCHEDULE_DATA);

  // Match State
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [teamA, setTeamA] = useState(TEAMS_DATA[0]);
  const [teamB, setTeamB] = useState(TEAMS_DATA[1]);
  
  // Scoring State
  const [innings, setInnings] = useState(1);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [extras, setExtras] = useState({ wide: 0, noball: 0, bye: 0 });
  const [freeHit, setFreeHit] = useState(false);
  
  // Player lineup state
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [nextBatsmanIndex, setNextBatsmanIndex] = useState(2);
  
  // Ball history for current over
  const [currentOver, setCurrentOver] = useState([]);
  const [overHistory, setOverHistory] = useState([]);
  
  // First innings score (target context)
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [firstInningsWickets, setFirstInningsWickets] = useState(0);
  const [target, setTarget] = useState(null);
  
  // Stats tracking for active match
  const [batsmenStats, setBatsmenStats] = useState({});
  const [bowlerStats, setBowlerStats] = useState({});
  
  // Dynamic visual notifications
  const [celebration, setCelebration] = useState(null);
  const [celebrationText, setCelebrationText] = useState("");
  
  // Setup match parameters
  const [selectedTeamAId, setSelectedTeamAId] = useState(TEAMS_DATA[0].id);
  const [selectedTeamBId, setSelectedTeamBId] = useState(TEAMS_DATA[1].id);

  // FIX: Ball history for undo functionality
  const [ballHistory, setBallHistory] = useState([]);
  
  // FIX: Toast system for alerts
  const [toast, setToast] = useState(null);

  // FIX: localStorage persistence
  useEffect(() => {
    if (matchStarted && !matchCompleted) {
      const saveState = {
        innings, runs, wickets, balls, extras, freeHit,
        striker, nonStriker, bowler, nextBatsmanIndex,
        currentOver, overHistory, firstInningsScore, firstInningsWickets, target,
        batsmenStats, bowlerStats, teamA, teamB
      };
      localStorage.setItem('howzatMatchState', JSON.stringify(saveState));
    }
  }, [innings, runs, wickets, balls, extras, freeHit, striker, nonStriker, bowler, nextBatsmanIndex, currentOver, overHistory, firstInningsScore, firstInningsWickets, target, batsmenStats, bowlerStats, matchStarted, matchCompleted]);

  // FIX: Attempt to resume match on load
  useEffect(() => {
    const saved = localStorage.getItem('howzatMatchState');
    if (saved && !matchStarted) {
      try {
        const state = JSON.parse(saved);
        showToast('Match in progress found! Resume?', 'info', () => {
          Object.entries(state).forEach(([key, value]) => {
            if (key === 'innings') setInnings(value);
            else if (key === 'runs') setRuns(value);
            else if (key === 'wickets') setWickets(value);
            else if (key === 'balls') setBalls(value);
            else if (key === 'extras') setExtras(value);
            else if (key === 'freeHit') setFreeHit(value);
            else if (key === 'striker') setStriker(value);
            else if (key === 'nonStriker') setNonStriker(value);
            else if (key === 'bowler') setBowler(value);
            else if (key === 'nextBatsmanIndex') setNextBatsmanIndex(value);
            else if (key === 'currentOver') setCurrentOver(value);
            else if (key === 'overHistory') setOverHistory(value);
            else if (key === 'firstInningsScore') setFirstInningsScore(value);
            else if (key === 'firstInningsWickets') setFirstInningsWickets(value);
            else if (key === 'target') setTarget(value);
            else if (key === 'batsmenStats') setBatsmenStats(value);
            else if (key === 'bowlerStats') setBowlerStats(value);
            else if (key === 'teamA') setTeamA(value);
            else if (key === 'teamB') setTeamB(value);
          });
          setMatchStarted(true);
          localStorage.removeItem('howzatMatchState');
        });
      } catch (e) {
        console.error('Failed to restore match:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (celebration) {
      const timer = setTimeout(() => {
        setCelebration(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [celebration]);

  const showToast = (message, type = 'info', onDismiss = null) => {
    setToast({ message, type, onDismiss });
    setTimeout(() => setToast(null), 3000);
  };

  // Start new match
  const handleStartMatch = (taId, tbId) => {
    if (taId === tbId) {
      showToast("Please select two different teams!", 'error');
      return;
    }
    const tA = teams.find(t => t.id === taId);
    const tB = teams.find(t => t.id === tbId);
    
    setTeamA(tA);
    setTeamB(tB);
    setInnings(1);
    setRuns(0);
    setWickets(0);
    setBalls(0);
    setExtras({ wide: 0, noball: 0, bye: 0 });
    setFreeHit(false);
    setBallHistory([]);
    
    const initBatsmen = {};
    tA.squad.forEach(player => {
      initBatsmen[player.id] = { name: player.name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    });
    
    const initBowlers = {};
    tB.squad.forEach(player => {
      initBowlers[player.id] = { name: player.name, overs: 0, balls: 0, runs: 0, wickets: 0 };
    });
    
    setBatsmenStats(initBatsmen);
    setBowlerStats(initBowlers);
    
    setStriker(tA.squad[0].id);
    setNonStriker(tA.squad[1].id);
    setBowler(tB.squad[4].id);
    setNextBatsmanIndex(2);
    
    setCurrentOver([]);
    setOverHistory([]);
    setFirstInningsScore(0);
    setFirstInningsWickets(0);
    setTarget(null);
    setMatchStarted(true);
    setMatchCompleted(false);
  };

  const swapBatsmen = () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
  };

  const formatOvers = (totalBalls) => {
    const ov = Math.floor(totalBalls / 6);
    const bl = totalBalls % 6;
    return `${ov}.${bl}`;
  };

  // FIX: Undo last ball
  const handleUndo = () => {
    if (ballHistory.length === 0) {
      showToast("No balls to undo!", 'error');
      return;
    }
    
    const previousState = ballHistory[ballHistory.length - 1];
    setBallHistory(ballHistory.slice(0, -1));
    
    setRuns(previousState.runs);
    setWickets(previousState.wickets);
    setBalls(previousState.balls);
    setExtras(previousState.extras);
    setFreeHit(previousState.freeHit);
    setStriker(previousState.striker);
    setNonStriker(previousState.nonStriker);
    setBatsmenStats(previousState.batsmenStats);
    setBowlerStats(previousState.bowlerStats);
    setCurrentOver(previousState.currentOver);
    setNextBatsmanIndex(previousState.nextBatsmanIndex);
    
    showToast("Ball undone!", 'success');
  };

  // FIX: Calculate real NRR
  const calculateNRR = (runsFor, ballsFaced, runsAgainst, ballsBowled) => {
    const oversFor = ballsFaced / 6;
    const oversAgainst = ballsBowled / 6;
    const rrrFor = oversFor > 0 ? runsFor / oversFor : 0;
    const rrrAgainst = oversAgainst > 0 ? runsAgainst / oversAgainst : 0;
    return parseFloat((rrrFor - rrrAgainst).toFixed(2));
  };

  // Main Scoring Engine Logic
  const handleDelivery = (type, value = 0) => {
    if (matchCompleted) return;

    // Save current state for undo
    const stateSnapshot = {
      runs, wickets, balls, extras, freeHit,
      striker, nonStriker, bowler, nextBatsmanIndex,
      batsmenStats, bowlerStats, currentOver
    };

    let isBallLegal = true;
    let runScored = 0;
    let extraScored = 0;
    let isWicket = false;
    let displayLabel = "";
    let celebrationType = null;
    let celebrationTextVal = "";
    let nextFreeHitValue = freeHit;

    // Process delivery
    if (type === 'run') {
      runScored = value;
      displayLabel = value === 0 ? "0" : `${value}`;
      if (value === 4) {
        celebrationType = 'FOUR';
        celebrationTextVal = `${batsmenStats[striker]?.name.split(" ")[0]} hits a gorgeous BOUNDARY! 🏏`;
      } else if (value === 6) {
        celebrationType = 'SIX';
        celebrationTextVal = `${batsmenStats[striker]?.name.split(" ")[0]} clears the rope! HUGE SIX! 🚀`;
      }
      nextFreeHitValue = false;
    } else if (type === 'wide') {
      extraScored = 1;
      isBallLegal = false;
      displayLabel = "WD";
      setExtras(prev => ({ ...prev, wide: prev.wide + 1 }));
    } else if (type === 'noball') {
      runScored = value;
      extraScored = 1;
      isBallLegal = false;
      displayLabel = "NB";
      setExtras(prev => ({ ...prev, noball: prev.noball + 1 }));
      nextFreeHitValue = true;
      celebrationType = 'FREE_HIT';
      celebrationTextVal = "NO BALL! FREE HIT NEXT! ⚡";
    } else if (type === 'noballboundary') {
      // FIX: No-ball boundaries now supported
      runScored = value;
      extraScored = 1;
      isBallLegal = false;
      displayLabel = "NB";
      setExtras(prev => ({ ...prev, noball: prev.noball + 1 }));
      nextFreeHitValue = true;
      celebrationType = value === 4 ? 'FOUR' : 'SIX';
      celebrationTextVal = `NO BALL ${value === 4 ? 'FOUR' : 'SIX'}! 🏏⚡ FREE HIT NEXT!`;
    } else if (type === 'wicket') {
      if (freeHit) {
        showToast("Free Hit Active! Batsman cannot be out!", 'error');
        return;
      }
      isWicket = true;
      displayLabel = "W";
      celebrationType = 'WICKET';
      celebrationTextVal = `OUT! ${batsmenStats[striker]?.name} has to walk back! 💥`;
      nextFreeHitValue = false;
    } else if (type === 'bye') {
      // FIX: Bye is legal and counts for strike rotation
      runScored = value;
      extraScored = 0;
      isBallLegal = true;
      displayLabel = `${value}B`;
      setExtras(prev => ({ ...prev, bye: prev.bye + value }));
    }

    const totalRunsThisBall = runScored + extraScored;
    const newRuns = runs + totalRunsThisBall;
    const newWickets = wickets + (isWicket ? 1 : 0);
    const newBalls = balls + (isBallLegal ? 1 : 0);

    setRuns(newRuns);
    setWickets(newWickets);
    if (isBallLegal) setBalls(newBalls);

    const updatedOver = [...currentOver, displayLabel];
    setCurrentOver(updatedOver);

    if (striker) {
      setBatsmenStats(prev => {
        const stats = { ...prev[striker] };
        stats.balls += isBallLegal ? 1 : 0;
        stats.runs += runScored;
        if (runScored === 4) stats.fours += 1;
        if (runScored === 6) stats.sixes += 1;
        if (isWicket) stats.out = true;
        return { ...prev, [striker]: stats };
      });
    }

    if (bowler) {
      setBowlerStats(prev => {
        const stats = { ...prev[bowler] };
        if (isBallLegal) stats.balls += 1;
        stats.runs += totalRunsThisBall;
        if (isWicket) stats.wickets += 1;
        stats.overs = formatOvers(stats.balls);
        return { ...prev, [bowler]: stats };
      });
    }

    setFreeHit(nextFreeHitValue);
    if (celebrationType) {
      setCelebration(celebrationType);
      setCelebrationText(celebrationTextVal);
    }

    // Add to ball history for undo
    setBallHistory([...ballHistory, stateSnapshot]);

    // Handle Wicket
    let allOut = false;
    if (isWicket) {
      if (newWickets >= 6) {
        allOut = true;
      } else {
        const nextBatsman = teamA.squad[nextBatsmanIndex];
        if (nextBatsman) {
          setStriker(nextBatsman.id);
          setNextBatsmanIndex(prev => prev + 1);
        } else {
          allOut = true;
        }
      }
    }

    // Handle end of over
    let overCompleted = false;
    if (isBallLegal && newBalls > 0 && newBalls % 6 === 0) {
      overCompleted = true;
    }

    // FIX: Strike rotation now includes byes with odd runs
    if (runScored % 2 !== 0 && !isWicket) {
      swapBatsmen();
    }

    // Target Check for 2nd Innings
    if (innings === 2) {
      if (newRuns >= target) {
        handleEndMatch(newRuns, newWickets, newBalls, false);
        return;
      }
    }

    // Innings or Match End Conditions
    if (newBalls >= 36 || allOut) {
      if (innings === 1) {
        setFirstInningsScore(newRuns);
        setFirstInningsWickets(newWickets);
        setTarget(newRuns + 1);
        setCelebration('FREE_HIT');
        setCelebrationText(`Innings Complete! Target for ${teamB.name} is ${newRuns + 1} runs.`);
        
        setTimeout(() => {
          setInnings(2);
          setRuns(0);
          setWickets(0);
          setBalls(0);
          setExtras({ wide: 0, noball: 0, bye: 0 });
          setFreeHit(false);
          
          const tempTeam = teamA;
          setTeamA(teamB);
          setTeamB(tempTeam);
          
          const nextBatsmen = {};
          teamB.squad.forEach(player => {
            nextBatsmen[player.id] = { name: player.name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
          });
          
          const nextBowlers = {};
          tempTeam.squad.forEach(player => {
            nextBowlers[player.id] = { name: player.name, overs: 0, balls: 0, runs: 0, wickets: 0 };
          });
          
          setBatsmenStats(nextBatsmen);
          setBowlerStats(nextBowlers);
          
          setStriker(teamB.squad[0].id);
          setNonStriker(teamB.squad[1].id);
          setBowler(tempTeam.squad[4].id);
          setNextBatsmanIndex(2);
          
          setCurrentOver([]);
          setOverHistory([]);
        }, 3000);

      } else {
        handleEndMatch(newRuns, newWickets, newBalls, true);
      }
    } else if (overCompleted) {
      swapBatsmen();
      setOverHistory(prev => [...prev, updatedOver]);
      setCurrentOver([]);
      
      // FIX: Bowler rotation with max 2 overs validation (now showing intent, not enforced)
      const currentBowlerIndex = teamB.squad.findIndex(p => p.id === bowler);
      let nextBowlerIndex = (currentBowlerIndex + 1) % teamB.squad.length;
      if (nextBowlerIndex < 4) nextBowlerIndex = 4;
      
      setBowler(teamB.squad[nextBowlerIndex].id);
      
      setCelebration('FREE_HIT');
      setCelebrationText(`Over complete! ${teamB.squad[nextBowlerIndex].name} takes the ball.`);
    }
  };

  // Complete Match and Update Points Table
  const handleEndMatch = (finalRuns, finalWickets, finalBalls, inningsOver) => {
    setMatchCompleted(true);
    setCelebration('WIN');
    
    let winnerName = "";
    let msg = "";
    let winningTeamId = "";
    let losingTeamId = "";
    
    if (inningsOver && finalRuns < target - 1) {
      winnerName = teamB.name;
      const margin = (target - 1) - finalRuns;
      msg = `${winnerName} won by ${margin} run${margin > 1 ? 's' : ''}! 🏆`;
      winningTeamId = teamB.id;
      losingTeamId = teamA.id;
    } else if (finalRuns >= target) {
      winnerName = teamA.name;
      const wicketsLeft = 6 - finalWickets;
      msg = `${winnerName} won by ${wicketsLeft} wickets! 🏆`;
      winningTeamId = teamA.id;
      losingTeamId = teamB.id;
    } else {
      msg = "It's a TIE! What a thriller! 🤝";
    }
    
    setCelebrationText(msg);

    if (winningTeamId && losingTeamId) {
      setTeams(prevTeams => {
        return prevTeams.map(team => {
          if (team.id === winningTeamId) {
            const currentStats = team.stats;
            // FIX: Real NRR calculation
            const nrr = calculateNRR(runs, balls, firstInningsScore, 36);
            return {
              ...team,
              stats: {
                played: currentStats.played + 1,
                won: currentStats.won + 1,
                lost: currentStats.lost,
                points: currentStats.points + 2,
                nrr: currentStats.nrr + nrr
              }
            };
          } else if (team.id === losingTeamId) {
            const currentStats = team.stats;
            const nrr = calculateNRR(firstInningsScore, 36, runs, balls);
            return {
              ...team,
              stats: {
                played: currentStats.played + 1,
                won: currentStats.won,
                lost: currentStats.lost + 1,
                points: currentStats.points,
                nrr: currentStats.nrr + nrr
              }
            };
          }
          return team;
        });
      });

      setSchedule(prevSchedule => {
        return prevSchedule.map(m => {
          if (m.status === 'live') {
            return {
              ...m,
              status: "completed",
              scoreA: innings === 2 
                ? `${firstInningsScore}/${firstInningsWickets} (6.0 ov)`
                : `${runs}/${wickets} (${formatOvers(balls)} ov)`,
              scoreB: `${finalRuns}/${finalWickets} (${formatOvers(finalBalls)} ov)`,
              result: msg
            };
          }
          return m;
        });
      });
    }

    localStorage.removeItem('howzatMatchState');
  };

  const resetMatch = () => {
    setMatchStarted(false);
    setMatchCompleted(false);
    setInnings(1);
    setRuns(0);
    setWickets(0);
    setBalls(0);
    setExtras({ wide: 0, noball: 0, bye: 0 });
    setCurrentOver([]);
    setOverHistory([]);
    setFirstInningsScore(0);
    setFirstInningsWickets(0);
    setTarget(null);
    setBallHistory([]);
    localStorage.removeItem('howzatMatchState');
  };

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.stats.points !== a.stats.points) {
      return b.stats.points - a.stats.points;
    }
    return b.stats.nrr - a.stats.nrr;
  });

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans selection:bg-lime-400 selection:text-[#070a13] pb-16 overflow-x-hidden">
      
      {/* FIX: Toast Notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-950 border border-red-500/30 text-red-400' :
          toast.type === 'success' ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400' :
          'bg-slate-900 border border-slate-700 text-slate-200'
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
          {toast.onDismiss && (
            <button 
              onClick={toast.onDismiss}
              className="text-xs font-bold ml-2 underline hover:no-underline"
            >
              Yes
            </button>
          )}
        </div>
      )}
      
      {/* Dynamic Celebration Popups */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in transition-all">
          <div className="glass-panel-neon border-lime-400 border-2 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden transform scale-100 transition-transform duration-300">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-lime-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
            
            {celebration === 'FOUR' && <span className="text-6xl block mb-4 animate-bounce">🏏🔥</span>}
            {celebration === 'SIX' && <span className="text-6xl block mb-4 animate-bounce">🚀🔥</span>}
            {celebration === 'WICKET' && <span className="text-6xl block mb-4 animate-bounce">💥💀</span>}
            {celebration === 'FREE_HIT' && <span className="text-6xl block mb-4 animate-bounce">⚡🏏</span>}
            {celebration === 'WIN' && <span className="text-6xl block mb-4 animate-bounce">🏆🎉</span>}
            
            <h2 className="text-4xl font-black uppercase tracking-wider text-lime-400 mb-2 animate-pulse-glow">
              {celebration === 'FOUR' && 'FOUR!'}
              {celebration === 'SIX' && 'SIX!'}
              {celebration === 'WICKET' && 'OUT!'}
              {celebration === 'FREE_HIT' && 'NOTICE'}
              {celebration === 'WIN' && 'CONGRATS!'}
            </h2>
            <p className="text-xl font-bold text-slate-100">{celebrationText}</p>
          </div>
        </div>
      )}

      {/* Hero Header Section */}
      <header className="relative bg-gradient-to-b from-slate-900 to-[#070a13] border-b border-slate-800/80 overflow-hidden">
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-1/4 translate-x-1/2 w-80 h-32 bg-lime-400/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-lime-400 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20 animate-float">
              <Trophy className="w-8 h-8 text-slate-950 font-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                HOWZAT
              </h1>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Six-Over Cricket Championship
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            {[
              { id: 'home', label: 'Tournament Hub', icon: Award },
              { id: 'live', label: 'Live Scorer', icon: Play, pulse: matchStarted },
              { id: 'teams', label: 'Teams & Standings', icon: Users },
              { id: 'rules', label: 'Tournament Rules', icon: Info }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${tab.pulse && !matchCompleted ? 'animate-pulse text-red-500' : ''}`} />
                <span>{tab.label}</span>
                {tab.pulse && !matchCompleted && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 mt-8">

        {/* -------------------- TAB: HOME / TOURNAMENT HUB -------------------- */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 px-3 py-1 rounded-full text-lime-400 text-xs font-black tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> Live Tournament Event
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Welcome to the <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">HOWZAT Cup</span>
                </h2>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                  Experience fast-paced, high-octane cricket matches limited to 6 overs per innings. Six teams battle for the ultimate crown in a round-robin stage followed by the grand final. Keep the scoreboard updated in real-time!
                </p>
                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => setActiveTab('live')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:brightness-110 transition"
                  >
                    <span>{matchStarted ? "Go to Live Match" : "Launch Live Scorer"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('rules')}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition"
                  >
                    <span>Read Format Rules</span>
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="w-56 h-56 bg-gradient-to-br from-lime-400/20 to-emerald-500/20 rounded-full blur-3xl absolute -inset-2"></div>
                <div className="relative glass-panel border-lime-500/20 rounded-2xl p-6 text-center w-60 border">
                  <Flame className="w-12 h-12 text-lime-400 mx-auto animate-bounce" />
                  <div className="mt-4 font-bold text-xs uppercase tracking-widest text-slate-400">Match 4 Active</div>
                  <div className="mt-2 text-lg font-black text-slate-200">GLA vs YKI</div>
                  <div className="mt-1 text-sm font-semibold text-lime-400">Stadium Lights On</div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500/20 rounded-full text-red-500 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Live
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-lime-400" />
                  <span>Match Schedule & Results</span>
                </h3>
                
                <div className="space-y-4">
                  {schedule.map(match => (
                    <div 
                      key={match.id}
                      className={`glass-panel rounded-2xl p-5 border transition-all duration-200 ${
                        match.status === 'live' 
                          ? 'border-red-500/30 shadow-md shadow-red-500/5' 
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Match {match.matchNo} • {match.date}
                        </span>
                        {match.status === 'completed' && (
                          <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-bold text-slate-400 uppercase">
                            Finished
                          </span>
                        )}
                        {match.status === 'live' && (
                          <span className="px-2.5 py-0.5 bg-red-950/80 border border-red-800/30 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Live Scorer
                          </span>
                        )}
                        {match.status === 'upcoming' && (
                          <span className="px-2.5 py-0.5 bg-lime-950/80 border border-lime-800/20 rounded-full text-[10px] font-bold text-lime-400 uppercase">
                            {match.time}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4 py-2">
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-2xl">{match.emojiA}</span>
                          <div>
                            <div className="font-bold text-slate-200">{match.teamA}</div>
                            {match.status === 'completed' && (
                              <div className="text-xs text-slate-400 font-semibold">{match.scoreA}</div>
                            )}
                          </div>
                        </div>

                        <div className="px-3 py-1 bg-slate-900 border border-slate-800 text-xs font-black text-slate-500 rounded-full">
                          VS
                        </div>

                        <div className="flex-1 flex items-center justify-end gap-3 text-right">
                          <div>
                            <div className="font-bold text-slate-200">{match.teamB}</div>
                            {match.status === 'completed' && (
                              <div className="text-xs text-slate-400 font-semibold">{match.scoreB}</div>
                            )}
                          </div>
                          <span className="text-2xl">{match.emojiB}</span>
                        </div>
                      </div>

                      {match.status === 'completed' && (
                        <div className="mt-4 pt-3 border-t border-slate-850 flex items-center gap-2 text-xs font-semibold text-lime-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>{match.result}</span>
                        </div>
                      )}
                      {match.status === 'live' && (
                        <div className="mt-4 pt-3 border-t border-slate-850 flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold">Currently playing at {match.venue}</span>
                          <button
                            onClick={() => {
                              setActiveTab('live');
                              if (!matchStarted) {
                                handleStartMatch('gla', 'yki');
                              }
                            }}
                            className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 hover:underline"
                          >
                            <span>Open Scoring Board</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {match.status === 'upcoming' && (
                        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Venue: {match.venue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-lime-400" />
                  <span>Standings Table</span>
                </h3>
                
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800 pb-2 text-left">
                          <th className="pb-3 font-semibold">Team</th>
                          <th className="pb-3 text-center font-semibold">P</th>
                          <th className="pb-3 text-center font-semibold">W</th>
                          <th className="pb-3 text-center font-semibold">PTS</th>
                          <th className="pb-3 text-right font-semibold">NRR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTeams.map((team, idx) => (
                          <tr key={team.id} className="border-b border-slate-900/50 hover:bg-slate-900/20 last:border-0">
                            <td className="py-3 font-bold flex items-center gap-2">
                              <span className="text-slate-500 text-xs w-4">{idx + 1}</span>
                              <span className="text-lg">{team.emoji}</span>
                              <span className="text-slate-200">{team.shortName}</span>
                            </td>
                            <td className="py-3 text-center text-slate-400">{team.stats.played}</td>
                            <td className="py-3 text-center text-slate-400">{team.stats.won}</td>
                            <td className="py-3 text-center text-lime-400 font-extrabold">{team.stats.points}</td>
                            <td className={`py-3 text-right font-mono text-xs ${team.stats.nrr >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {team.stats.nrr >= 0 ? `+${team.stats.nrr}` : team.stats.nrr}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------- TAB: LIVE CRICKET SCOREKEEPER -------------------- */}
        {activeTab === 'live' && (
          <div className="animate-fade-in space-y-8">
            
            {!matchStarted ? (
              <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-100 uppercase tracking-wide">
                    Setup Live Match
                  </h3>
                  <p className="text-sm text-slate-400">
                    Select the competing teams to initiate the live 6-overs scoreboard session.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label htmlFor="teamA" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Batting First (Team A)
                    </label>
                    <select 
                      id="teamA"
                      value={selectedTeamAId}
                      onChange={(e) => setSelectedTeamAId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-200 focus:border-lime-400 focus:outline-none"
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="teamB" className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Bowling First (Team B)
                    </label>
                    <select 
                      id="teamB"
                      value={selectedTeamBId}
                      onChange={(e) => setSelectedTeamBId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-200 focus:border-lime-400 focus:outline-none"
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => handleStartMatch(selectedTeamAId, selectedTeamBId)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-black rounded-xl hover:brightness-110 shadow-lg shadow-lime-400/20 active:scale-95 transition"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>START MATCH (6 OVERS)</span>
                  </button>
                </div>
              </div>
            ) : (
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-6">
                  
                  <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800/80 relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950">
                    <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-black tracking-widest rounded-md uppercase">
                          Innings {innings}
                        </span>
                        {freeHit && (
                          <span className="px-3 py-1 bg-red-950/80 border border-red-500/30 text-red-400 text-xs font-black tracking-widest rounded-md uppercase animate-pulse">
                            Free Hit!
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Howzat Arena
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
                      <div>
                        <h2 className="text-3xl font-black text-slate-300 flex items-center gap-2">
                          <span className="text-4xl">{teamA.emoji}</span>
                          <span>{teamA.name}</span>
                        </h2>
                        
                        <div className="flex items-baseline gap-4 mt-2">
                          <span className="text-6xl md:text-7xl font-black tracking-tight text-white select-none">
                            {runs}/{wickets}
                          </span>
                          <span className="text-lg md:text-xl font-bold text-slate-400">
                            ({formatOvers(balls)} / 6.0 Ov)
                          </span>
                        </div>
                      </div>

                      {innings === 2 && target && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:text-right space-y-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Target: {target}
                          </div>
                          <div className="text-lg font-black text-lime-400">
                            Need {target - runs} runs from {36 - balls} balls
                          </div>
                          <div className="text-xs text-slate-500 font-semibold">
                            Req Run Rate: {parseFloat((((target - runs) / (36 - balls)) * 6).toFixed(2)) || 0} RPO
                          </div>
                        </div>
                      )}

                      {innings === 1 && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:text-right space-y-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Current Run Rate
                          </div>
                          <div className="text-2xl font-black text-lime-400">
                            {balls > 0 ? (runs / (balls / 6)).toFixed(2) : "0.00"}
                          </div>
                          <div className="text-xs text-slate-500 font-semibold">
                            Projected: {balls > 0 ? Math.round((runs / (balls / 6)) * 6) : 0} runs
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batsmen</div>
                        
                        <div className="space-y-2">
                          {striker && batsmenStats[striker] && (
                            <div className="flex justify-between items-center p-2 rounded-xl bg-lime-400/5 border border-lime-400/20">
                              <span className="font-bold text-lime-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></span>
                                {batsmenStats[striker].name} *
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                {batsmenStats[striker].runs} <span className="text-xs text-slate-500">({batsmenStats[striker].balls}b)</span>
                              </span>
                            </div>
                          )}

                          {nonStriker && batsmenStats[nonStriker] && (
                            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/40 border border-slate-850">
                              <span className="font-semibold text-slate-300">
                                {batsmenStats[nonStriker].name}
                              </span>
                              <span className="font-mono text-slate-400">
                                {batsmenStats[nonStriker].runs} <span className="text-xs text-slate-500">({batsmenStats[nonStriker].balls}b)</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bowler</div>
                        
                        <div className="space-y-2">
                          {bowler && bowlerStats[bowler] && (
                            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/40 border border-slate-850">
                              <span className="font-bold text-slate-300">
                                {bowlerStats[bowler].name}
                              </span>
                              <div className="text-right">
                                <div className="font-mono font-bold text-slate-200">
                                  {bowlerStats[bowler].wickets}-{bowlerStats[bowler].runs}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Overs: {bowlerStats[bowler].overs}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center px-2 py-1 text-xs text-slate-400 bg-slate-900/20 border border-slate-900 rounded-lg">
                            <span className="font-semibold">Extras:</span>
                            <span className="font-mono font-semibold">
                              {extras.wide + extras.noball + extras.bye} (WD: {extras.wide}, NB: {extras.noball}, B: {extras.bye})
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        This Over:
                      </span>
                      
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {currentOver.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">First delivery pending...</span>
                        ) : (
                          currentOver.map((ball, idx) => {
                            let ballBg = "bg-slate-800 border-slate-700 text-slate-300";
                            if (ball === 'W') ballBg = "bg-red-600 border-red-500 text-white font-extrabold";
                            else if (ball === '4') ballBg = "bg-blue-600 border-blue-500 text-white font-extrabold";
                            else if (ball === '6') ballBg = "bg-emerald-600 border-emerald-500 text-white font-extrabold";
                            else if (ball === 'WD' || ball === 'NB') ballBg = "bg-amber-600 border-amber-500 text-white font-bold";

                            return (
                              <span 
                                key={idx} 
                                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono select-none flex-shrink-0 shadow-sm ${ballBg}`}
                              >
                                {ball}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
                    <h3 className="text-lg font-bold text-slate-200">Full Innings Scorecard</h3>
                    
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batting: {teamA.name}</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-800 pb-2 text-left font-semibold text-xs">
                              <th className="pb-2">Batter</th>
                              <th className="pb-2 text-center">Status</th>
                              <th className="pb-2 text-center">Runs</th>
                              <th className="pb-2 text-center">Balls</th>
                              <th className="pb-2 text-center">4s</th>
                              <th className="pb-2 text-center">6s</th>
                              <th className="pb-2 text-right">SR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(batsmenStats).map(pId => {
                              const stats = batsmenStats[pId];
                              const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                              const isActive = pId === striker || pId === nonStriker;
                              
                              return (
                                <tr key={pId} className={`border-b border-slate-900 last:border-0 ${isActive ? 'bg-slate-900/30' : ''}`}>
                                  <td className="py-2.5 font-bold text-slate-200">
                                    {stats.name} {isActive && <span className="text-lime-400">*</span>}
                                  </td>
                                  <td className="py-2.5 text-center text-xs text-slate-400">
                                    {stats.out ? (
                                      <span className="text-red-400 font-semibold">Out</span>
                                    ) : stats.balls > 0 ? (
                                      <span className="text-emerald-400 font-semibold">Not Out</span>
                                    ) : (
                                      <span className="text-slate-500">Yet to bat</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-center font-bold text-slate-200">{stats.runs}</td>
                                  <td className="py-2.5 text-center text-slate-400">{stats.balls}</td>
                                  <td className="py-2.5 text-center text-slate-400">{stats.fours}</td>
                                  <td className="py-2.5 text-center text-slate-400">{stats.sixes}</td>
                                  <td className="py-2.5 text-right font-mono text-xs text-slate-400">{sr}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bowling: {teamB.name}</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-800 pb-2 text-left font-semibold text-xs">
                              <th className="pb-2">Bowler</th>
                              <th className="pb-2 text-center">Overs</th>
                              <th className="pb-2 text-center">Runs</th>
                              <th className="pb-2 text-center">Wickets</th>
                              <th className="pb-2 text-right">Econ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(bowlerStats).map(pId => {
                              const stats = bowlerStats[pId];
                              const oversNum = (stats.balls / 6) || 0;
                              const econ = oversNum > 0 ? (stats.runs / oversNum).toFixed(2) : "0.00";
                              const isActive = pId === bowler;

                              return (
                                <tr key={pId} className={`border-b border-slate-900 last:border-0 ${isActive ? 'bg-slate-900/30' : ''}`}>
                                  <td className="py-2.5 font-bold text-slate-200">
                                    {stats.name} {isActive && <span className="text-lime-400">*</span>}
                                  </td>
                                  <td className="py-2.5 text-center text-slate-400">{stats.overs}</td>
                                  <td className="py-2.5 text-center text-slate-200">{stats.runs}</td>
                                  <td className="py-2.5 text-center font-bold text-lime-400">{stats.wickets}</td>
                                  <td className="py-2.5 text-right font-mono text-xs text-slate-400">{econ}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right Side: Admin Scoring Panel Controls */}
                <div className="space-y-6">
                  
                  <div className="glass-panel border-lime-400/20 border rounded-3xl p-6 relative overflow-hidden bg-slate-900/40">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-lime-400/5 rounded-full blur-3xl"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-lime-400 fill-current" />
                        <span>Scoring Console</span>
                      </h3>
                      {matchCompleted && (
                        <span className="px-2 py-0.5 bg-red-950 border border-red-500/30 rounded text-[10px] font-bold text-red-400 uppercase">
                          Match Over
                        </span>
                      )}
                    </div>

                    {!matchCompleted ? (
                      <div className="space-y-6">
                        
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Register Runs
                          </span>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: '0 Runs', val: 0 },
                              { label: '1 Run', val: 1 },
                              { label: '2 Runs', val: 2 },
                              { label: '3 Runs', val: 3 },
                              { label: '4 Runs', val: 4 },
                              { label: '6 Runs', val: 6 },
                            ].map(btn => (
                              <button
                                key={btn.val}
                                onClick={() => handleDelivery('run', btn.val)}
                                className="py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-slate-100 font-bold rounded-xl active:scale-95 transition text-sm shadow-sm"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-850">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Register Extras
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleDelivery('wide')}
                              className="py-3 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/20 text-amber-400 font-bold rounded-xl active:scale-95 transition text-sm"
                            >
                              Wide Ball (+1)
                            </button>
                            <button
                              onClick={() => handleDelivery('noball')}
                              className="py-3 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/20 text-amber-400 font-bold rounded-xl active:scale-95 transition text-sm"
                            >
                              No Ball (+1)
                            </button>
                          </div>
                          {/* FIX: No-ball boundary buttons */}
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <button
                              onClick={() => handleDelivery('noballboundary', 4)}
                              className="py-2 bg-amber-950/50 hover:bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold rounded-lg active:scale-95 transition text-xs"
                            >
                              NB Four
                            </button>
                            <button
                              onClick={() => handleDelivery('noballboundary', 6)}
                              className="py-2 bg-amber-950/50 hover:bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold rounded-lg active:scale-95 transition text-xs"
                            >
                              NB Six
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-850">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Register Dismissals & Byes
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleDelivery('wicket')}
                              className="py-3 bg-red-950/30 hover:bg-red-950/50 border border-red-500/20 text-red-400 font-black rounded-xl active:scale-95 transition text-sm uppercase"
                            >
                              OUT / WICKET 💀
                            </button>
                            <button
                              onClick={() => handleDelivery('bye', 1)}
                              className="py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 font-bold rounded-xl active:scale-95 transition text-sm"
                            >
                              Bye (+1)
                            </button>
                          </div>
                        </div>

                        {/* FIX: Undo button */}
                        <div className="pt-2 border-t border-slate-850">
                          <button
                            onClick={handleUndo}
                            disabled={ballHistory.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-950/40 hover:bg-violet-950/60 disabled:opacity-50 disabled:cursor-not-allowed border border-violet-500/20 text-violet-300 font-bold rounded-lg active:scale-95 transition text-sm"
                          >
                            <Undo2 className="w-4 h-4" />
                            <span>Undo Last Ball</span>
                          </button>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-850">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Lineup Adjustments
                            </span>
                            <button 
                              onClick={swapBatsmen}
                              className="text-xs font-bold text-lime-400 hover:underline flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3 rotate-180" /> Swap Batters
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="striker" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                Striker Batsman
                              </label>
                              <select 
                                id="striker"
                                value={striker || ""} 
                                onChange={(e) => setStriker(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none"
                              >
                                {teamA.squad.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label htmlFor="bowler" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                Active Bowler
                              </label>
                              <select 
                                id="bowler"
                                value={bowler || ""} 
                                onChange={(e) => setBowler(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none"
                              >
                                {teamB.squad.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <CheckCircle className="w-16 h-16 text-lime-400 mx-auto animate-pulse" />
                        <h4 className="text-xl font-black text-slate-200">MATCH FINISHED</h4>
                        <p className="text-sm text-slate-400 font-semibold px-4">
                          {celebrationText}
                        </p>
                        <button
                          onClick={resetMatch}
                          className="mt-4 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-lime-400 text-slate-950 font-bold rounded-xl hover:brightness-110 active:scale-95 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset & Scorer Hub</span>
                        </button>
                      </div>
                    )}

                    {!matchCompleted && (
                      <div className="mt-6 pt-4 border-t border-slate-850 flex justify-end">
                        <button 
                          onClick={resetMatch}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Abort Match</span>
                        </button>
                      </div>
                    )}

                  </div>

                  <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Completed Overs History
                    </h4>
                    
                    {overHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No completed overs yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {overHistory.map((over, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-850/50 last:border-0">
                            <span className="text-xs font-bold text-slate-400">Over {idx + 1}</span>
                            <div className="flex items-center gap-1.5">
                              {over.map((ball, bIdx) => {
                                let ballBg = "bg-slate-900 border-slate-800 text-slate-400";
                                if (ball === 'W') ballBg = "bg-red-950 border-red-900 text-red-400 font-bold";
                                else if (ball === '4') ballBg = "bg-blue-950 border-blue-900 text-blue-400 font-bold";
                                else if (ball === '6') ballBg = "bg-emerald-950 border-emerald-900 text-emerald-400 font-bold";
                                return (
                                  <span key={bIdx} className={`w-6 h-6 rounded-full border text-[10px] flex items-center justify-center font-mono ${ballBg}`}>
                                    {ball}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* -------------------- TAB: TEAMS & SQUADS -------------------- */}
        {activeTab === 'teams' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-wide text-slate-100">
                Competing Teams & Squads
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Click on any team to view their active 7-member squad lineup and current stand in the tournament points table.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <div 
                  key={team.id}
                  className="glass-panel border-slate-800 border rounded-3xl p-6 hover:border-slate-700 transition duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition duration-300 rounded-bl-full"></div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-900 border border-slate-800 text-3xl">
                      {team.emoji}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-100">{team.name}</h3>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        {team.shortName} • Roster
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950/40 border border-slate-900 rounded-xl p-3 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Played</div>
                      <div className="text-sm font-extrabold text-slate-300">{team.stats.played}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wins</div>
                      <div className="text-sm font-extrabold text-slate-300">{team.stats.won}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Points</div>
                      <div className="text-sm font-black text-lime-400">{team.stats.points}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lineup (7 Players)</div>
                    <div className="space-y-1">
                      {team.squad.map(player => (
                        <div key={player.id} className="flex items-center gap-2 py-1 text-sm font-medium text-slate-300 hover:text-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                          <span>{player.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------- TAB: TOURNAMENT RULES -------------------- */}
        {activeTab === 'rules' && (
          <div className="animate-fade-in max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-wide text-slate-100">
                Tournament Format & Regulations
              </h2>
              <p className="text-sm text-slate-400">
                Familiarize yourself with the Howzat 6-Overs (T6) rules that keep the game fast and exciting.
              </p>
            </div>

            <div className="glass-panel border-slate-800 border rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="space-y-4">
                {RULES.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-slate-900/20 border border-slate-900 rounded-2xl hover:border-slate-800/80 transition duration-200">
                    <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 font-black flex items-center justify-center flex-shrink-0 text-sm select-none">
                      {idx + 1}
                    </div>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed pt-0.5">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-gradient-to-br from-lime-400/5 to-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-lime-400/10 rounded-2xl border border-lime-400/20 text-lime-400">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Why 6 Overs?
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for super-fast street/gully/community cricket festivals, T6 forces teams to hit from the very first ball, making every delivery crucial. High risks, huge boundaries, minimal slogfests.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-600 font-medium">
        <p>© 2026 Howzat Cricket Tournament. Hosted by Neha.</p>
        <p className="mt-1 text-slate-700">Built using React, Tailwind CSS, & Lucide Icons.</p>
      </footer>

    </div>
  );
}

export default App;
