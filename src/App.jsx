import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Play, 
  RotateCcw, 
  Info, 
  Award, 
  Clock, 
  MapPin, 
  TrendingUp, 
  CheckCircle,
  HelpCircle,
  Zap,
  Flame,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { TEAMS_DATA, SCHEDULE_DATA, RULES } from './mockData';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('home');
  
  // Teams and Points Table State (allows updates after live match finishes)
  const [teams, setTeams] = useState(TEAMS_DATA);
  const [schedule, setSchedule] = useState(SCHEDULE_DATA);

  // Match State
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [teamA, setTeamA] = useState(TEAMS_DATA[0]); // Batting first
  const [teamB, setTeamB] = useState(TEAMS_DATA[1]); // Bowling first
  
  // Scoring State
  const [innings, setInnings] = useState(1); // 1 or 2
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0); // 36 balls max
  const [extras, setExtras] = useState({ wide: 0, noball: 0, bye: 0 });
  const [freeHit, setFreeHit] = useState(false);
  
  // Player lineup state
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [nextBatsmanIndex, setNextBatsmanIndex] = useState(2); // 0 and 1 are striker and non-striker
  
  // Ball history for current over
  const [currentOver, setCurrentOver] = useState([]); // Array of strings e.g. ['1', 'WD', 'W']
  const [overHistory, setOverHistory] = useState([]); // Array of arrays of strings
  
  // First innings score (target context)
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [firstInningsWickets, setFirstInningsWickets] = useState(0);
  const [target, setTarget] = useState(null);
  
  // Stats tracking for active match
  const [batsmenStats, setBatsmenStats] = useState({});
  const [bowlerStats, setBowlerStats] = useState({});
  
  // Dynamic visual notifications
  const [celebration, setCelebration] = useState(null); // 'FOUR' | 'SIX' | 'WICKET' | 'FREE_HIT' | 'WIN'
  const [celebrationText, setCelebrationText] = useState("");

  // Setup match parameters
  const [selectedTeamAId, setSelectedTeamAId] = useState(TEAMS_DATA[0].id);
  const [selectedTeamBId, setSelectedTeamBId] = useState(TEAMS_DATA[1].id);

  // Auto clear celebration alerts
  useEffect(() => {
    if (celebration) {
      const timer = setTimeout(() => {
        setCelebration(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [celebration]);

  // Start new match
  const handleStartMatch = (taId, tbId) => {
    if (taId === tbId) {
      alert("Please select two different teams!");
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
    
    // Initialize batsman/bowler stats
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
    
    // Lineup selection
    setStriker(tA.squad[0].id);
    setNonStriker(tA.squad[1].id);
    setBowler(tB.squad[4].id); // pick a default bowler (typically bowler is near bottom of list)
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

  // Helper for overs display
  const formatOvers = (totalBalls) => {
    const ov = Math.floor(totalBalls / 6);
    const bl = totalBalls % 6;
    return `${ov}.${bl}`;
  };

  // Main Scoring Engine Logic
  const handleDelivery = (type, value = 0) => {
    if (matchCompleted) return;

    let isBallLegal = true;
    let runScored = 0;
    let extraScored = 0;
    let isWicket = false;
    let displayLabel = "";

    // Clear previous free hit if legal delivery was bowled
    let nextFreeHitValue = freeHit;

    if (type === 'run') {
      runScored = value;
      displayLabel = value === 0 ? "0" : `${value}`;
      if (value === 4) {
        setCelebration('FOUR');
        setCelebrationText(`${batsmenStats[striker]?.name.split(" ")[0]} hits a gorgeous BOUNDARY! 🏏`);
      } else if (value === 6) {
        setCelebration('SIX');
        setCelebrationText(`${batsmenStats[striker]?.name.split(" ")[0]} clears the rope! HUGE SIX! 🚀`);
      }
      nextFreeHitValue = false; // Free hit expired
    } else if (type === 'wide') {
      extraScored = 1;
      isBallLegal = false;
      displayLabel = "WD";
      setExtras(prev => ({ ...prev, wide: prev.wide + 1 }));
    } else if (type === 'noball') {
      runScored = value; // can score off a no ball (batsman runs)
      extraScored = 1; // no ball cost
      isBallLegal = false;
      displayLabel = "NB";
      setExtras(prev => ({ ...prev, noball: prev.noball + 1 }));
      nextFreeHitValue = true; // next ball is a free hit
      setCelebration('FREE_HIT');
      setCelebrationText("NO BALL! FREE HIT NEXT! ⚡");
    } else if (type === 'wicket') {
      if (freeHit) {
        // batsman can only be run-out on free hit, let's treat normal wickets as not out
        alert("Free Hit Active! Batsman cannot be out!");
        return;
      }
      isWicket = true;
      displayLabel = "W";
      setCelebration('WICKET');
      setCelebrationText(`OUT! ${batsmenStats[striker]?.name} has to walk back! 💥`);
      nextFreeHitValue = false;
    } else if (type === 'bye') {
      extraScored = value;
      displayLabel = `${value}B`;
      setExtras(prev => ({ ...prev, bye: prev.bye + value }));
      nextFreeHitValue = false;
    }

    const totalRunsThisBall = runScored + extraScored;
    
    // Update Score state
    const newRuns = runs + totalRunsThisBall;
    const newWickets = wickets + (isWicket ? 1 : 0);
    const newBalls = balls + (isBallLegal ? 1 : 0);

    setRuns(newRuns);
    setWickets(newWickets);
    if (isBallLegal) setBalls(newBalls);

    // Update Over logger
    const updatedOver = [...currentOver, displayLabel];
    setCurrentOver(updatedOver);

    // Update Batsman stats
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

    // Update Bowler stats
    if (bowler) {
      setBowlerStats(prev => {
        const stats = { ...prev[bowler] };
        if (isBallLegal) stats.balls += 1;
        stats.runs += totalRunsThisBall;
        if (isWicket) stats.wickets += 1;
        
        // update overs display format
        stats.overs = formatOvers(stats.balls);
        return { ...prev, [bowler]: stats };
      });
    }

    // Set Free Hit state
    setFreeHit(nextFreeHitValue);

    // Handle Wicket: Select next batsman or check if all out
    let allOut = false;
    if (isWicket) {
      if (newWickets >= 6) { // 6 wickets down = 7 players all-out
        allOut = true;
      } else {
        // Bring in next batsman
        const nextBatsman = teamA.squad[nextBatsmanIndex];
        if (nextBatsman) {
          setStriker(nextBatsman.id);
          setNextBatsmanIndex(prev => prev + 1);
        } else {
          allOut = true;
        }
      }
    }

    // Handle end of over (6 legal balls)
    let overCompleted = false;
    if (isBallLegal && newBalls > 0 && newBalls % 6 === 0) {
      overCompleted = true;
    }

    // Swap batsman if odd runs scored (excluding extras like wide, but noball runs are scored by batsman)
    if (runScored % 2 !== 0 && !isWicket) {
      swapBatsmen();
    }

    // Target Check for 2nd Innings
    if (innings === 2) {
      if (newRuns >= target) {
        handleEndMatch(newRuns, newWickets, newBalls, false); // Batsmen chased it down
        return;
      }
    }

    // Innings or Match End Conditions
    if (newBalls >= 36 || allOut) {
      // Innings over or Team all out
      if (innings === 1) {
        // Transition to 2nd innings
        setFirstInningsScore(newRuns);
        setFirstInningsWickets(newWickets);
        setTarget(newRuns + 1);
        setCelebration('FREE_HIT');
        setCelebrationText(`Innings Complete! Target for ${teamB.name} is ${newRuns + 1} runs.`);
        
        // Timeout to switch innings
        setTimeout(() => {
          setInnings(2);
          setRuns(0);
          setWickets(0);
          setBalls(0);
          setExtras({ wide: 0, noball: 0, bye: 0 });
          setFreeHit(false);
          
          // Swap teams
          const tempTeam = teamA;
          setTeamA(teamB);
          setTeamB(tempTeam);
          
          // Re-initialize batsmen and bowlers
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
          setBowler(tempTeam.squad[4].id); // pick bowler
          setNextBatsmanIndex(2);
          
          setCurrentOver([]);
          setOverHistory([]);
        }, 3000);

      } else {
        // 2nd innings complete
        handleEndMatch(newRuns, newWickets, newBalls, true);
      }
    } else if (overCompleted) {
      // Prompt for bowler swap and rotate ends
      swapBatsmen();
      setOverHistory(prev => [...prev, updatedOver]);
      setCurrentOver([]);
      
      // Auto assign next bowler from bowling team roster that is not the current one
      const currentBowlerIndex = teamB.squad.findIndex(p => p.id === bowler);
      let nextBowlerIndex = (currentBowlerIndex + 1) % teamB.squad.length;
      // bowler usually is index 4, 5, 6
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
      // Bowling team won (Team B in 2nd innings, which was Team A batting first)
      winnerName = teamB.name; // teamB is bowling in 2nd innings (started batting first)
      const margin = (target - 1) - finalRuns;
      msg = `${winnerName} won by ${margin} run${margin > 1 ? 's' : ''}! 🏆`;
      winningTeamId = teamB.id;
      losingTeamId = teamA.id;
    } else if (finalRuns >= target) {
      // Batting team won (Team A in 2nd innings, chasing)
      winnerName = teamA.name;
      const wicketsLeft = 6 - finalWickets;
      msg = `${winnerName} won by ${wicketsLeft} wickets! 🏆`;
      winningTeamId = teamA.id;
      losingTeamId = teamB.id;
    } else {
      // Tie
      msg = "It's a TIE! What a thriller! 🤝";
    }
    
    setCelebrationText(msg);

    // Update point tables if it was tournament team match
    if (winningTeamId && losingTeamId) {
      setTeams(prevTeams => {
        return prevTeams.map(team => {
          if (team.id === winningTeamId) {
            const currentStats = team.stats;
            return {
              ...team,
              stats: {
                played: currentStats.played + 1,
                won: currentStats.won + 1,
                lost: currentStats.lost,
                points: currentStats.points + 2,
                nrr: parseFloat((currentStats.nrr + 0.5).toFixed(2)) // dummy NRR update
              }
            };
          } else if (team.id === losingTeamId) {
            const currentStats = team.stats;
            return {
              ...team,
              stats: {
                played: currentStats.played + 1,
                won: currentStats.won,
                lost: currentStats.lost + 1,
                points: currentStats.points,
                nrr: parseFloat((currentStats.nrr - 0.5).toFixed(2)) // dummy NRR update
              }
            };
          }
          return team;
        });
      });

      // Update Schedule to reflect completed match
      setSchedule(prevSchedule => {
        // find if active match matches schedule
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
  };

  // Sort teams by points, then net run rate
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.stats.points !== a.stats.points) {
      return b.stats.points - a.stats.points;
    }
    return b.stats.nrr - a.stats.nrr;
  });

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans selection:bg-lime-400 selection:text-[#070a13] pb-16 overflow-x-hidden">
      
      {/* Dynamic Celebration Popups */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in transition-all">
          <div className="glass-panel-neon border-lime-400 border-2 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden transform scale-100 transition-transform duration-300">
            {/* Pulsing neon background glow */}
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
        {/* Lights Effect */}
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

          {/* Navigation Bar */}
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
            {/* Hero Banner */}
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-lime-400/10 border border-lime-400/20 px-3 py-1 rounded-full text-lime-400 text-xs font-black tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> Live Tournament Event
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Welcome to the <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">HOWZAT Cup</span>
                </h2>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                  Experience fast-paced, high-octane cricket matches limited to 6 overs per innings. Six teams battle for the ultimate crown in a round-robin stage followed by the grand final. Keep track of scores live, view individual rosters, and explore player standings.
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
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500/20 rounded-full text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Live
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Match Schedule */}
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
                          <span className="px-2.5 py-0.5 bg-red-950/80 border border-red-800/30 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
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
                        {/* Team A */}
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-2xl">{match.emojiA}</span>
                          <div>
                            <div className="font-bold text-slate-200">{match.teamA}</div>
                            {match.status === 'completed' && (
                              <div className="text-xs text-slate-400 font-semibold">{match.scoreA}</div>
                            )}
                          </div>
                        </div>

                        {/* VS Divider */}
                        <div className="px-3 py-1 bg-slate-900 border border-slate-800 text-xs font-black text-slate-500 rounded-full">
                          VS
                        </div>

                        {/* Team B */}
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

                      {/* Result/Meta Details */}
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
                                // Auto setup live match based on active game
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

              {/* Right Column: Standings Summary */}
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
            
            {/* Non-Started Match Setup State */}
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
                  {/* Select Batting Team */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Batting First (Team A)
                    </label>
                    <select 
                      value={selectedTeamAId}
                      onChange={(e) => setSelectedTeamAId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 font-semibold text-slate-200 focus:border-lime-400 focus:outline-none"
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Bowling Team */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Bowling First (Team B)
                    </label>
                    <select 
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
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-black rounded-xl hover:brightness-110 shadow-lg shadow-emerald-500/10 transition"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>START MATCH (6 OVERS)</span>
                  </button>
                </div>
              </div>
            ) : (
              
              /* Active Match Scoreboard View */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Scoreboard & Stats */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Stadium Scoreboard Display */}
                  <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800/80 relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950">
                    {/* Glowing field lights background */}
                    <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    
                    {/* Header: Batting team and Innings */}
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

                    {/* Major Score Display */}
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

                      {/* Chase Status (Innings 2) */}
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

                      {/* Run Rate (Innings 1) */}
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

                    {/* Batsmen & Bowler Partnership Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      
                      {/* Active Batsmen */}
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batsmen</div>
                        
                        <div className="space-y-2">
                          {/* Striker */}
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

                          {/* Non-Striker */}
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

                      {/* Active Bowler */}
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

                          {/* Extras Details */}
                          <div className="flex justify-between items-center px-2 py-1 text-xs text-slate-400 bg-slate-900/20 border border-slate-900 rounded-lg">
                            <span className="font-semibold">Extras:</span>
                            <span className="font-mono font-semibold">
                              {extras.wide + extras.noball + extras.bye} (WD: {extras.wide}, NB: {extras.noball}, B: {extras.bye})
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Current Over ball-by-ball circle log */}
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

                  {/* Complete Batting and Bowling Scorecards Details */}
                  <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
                    <h3 className="text-lg font-bold text-slate-200">Full Innings Scorecard</h3>
                    
                    {/* Batsmen Scorecard */}
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

                    {/* Bowlers Scorecard */}
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
                              // econ runs per over
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
                  
                  {/* Console Container */}
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
                        
                        {/* Run Buttons Row */}
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

                        {/* Extra Buttons Row */}
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
                              onClick={() => handleDelivery('noball', 0)}
                              className="py-3 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/20 text-amber-400 font-bold rounded-xl active:scale-95 transition text-sm"
                            >
                              No Ball (+1)
                            </button>
                          </div>
                        </div>

                        {/* Wicket & Bye Buttons */}
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

                        {/* Manual swapping controls */}
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
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                Striker Batsman
                              </label>
                              <select 
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
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                Active Bowler
                              </label>
                              <select 
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
                      /* Completed Match Screen */
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

                    {/* Reset Button */}
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

                  {/* Over log details */}
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
                  {/* Subtle color flare on hover */}
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

                  {/* Points stats preview */}
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

                  {/* Squad List */}
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

              {/* Tournament Format Highlight */}
              <div className="p-5 bg-gradient-to-br from-lime-400/5 to-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-lime-400/10 rounded-2xl border border-lime-400/20 text-lime-400">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Why 6 Overs?
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for super-fast street/gully/community cricket festivals, T6 forces teams to hit from the very first ball, making every delivery crucial. High risks, huge boundaries, and dramatic finishes are guaranteed!
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
