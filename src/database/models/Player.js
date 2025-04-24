import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 1000, // Start with 1000 credits
    min: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  totalWinnings: {
    type: Number,
    default: 0
  },
  totalLosses: {
    type: Number,
    default: 0
  },
  highestWin: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Methods for updating player stats
playerSchema.methods.recordWin = function(amount) {
  this.balance += amount;
  this.gamesPlayed += 1;
  this.gamesWon += 1;
  this.totalWinnings += amount;
  
  if (amount > this.highestWin) {
    this.highestWin = amount;
  }
  
  return this.save();
};

playerSchema.methods.recordLoss = function(amount) {
  this.gamesPlayed += 1;
  this.totalLosses += amount;
  return this.save();
};

// Static method to find or create a player
playerSchema.statics.findOrCreate = async function(userId, username) {
  let player = await this.findOne({ userId });
  
  if (!player) {
    player = new this({
      userId,
      username
    });
    await player.save();
  }
  
  return player;
};

export const Player = mongoose.model('Player', playerSchema);