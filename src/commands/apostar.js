import { SlashCommandBuilder } from 'discord.js';
import { Player } from '../database/models/Player.js';

export const data = new SlashCommandBuilder()
  .setName('apostar')
  .setDescription('Realiza una apuesta para el juego Ride the Bus')
  .addIntegerOption(option =>
    option.setName('cantidad')
      .setDescription('Cantidad de créditos a apostar')
      .setMinValue(10)
      .setRequired(true));

export async function execute(interaction, client) {
  const betAmount = interaction.options.getInteger('cantidad');
  const userId = interaction.user.id;
  const username = interaction.user.username;
  
  // Check if player already exists, if not create a new one
  const player = await Player.findOrCreate(userId, username);
  
  // Check if player has enough credits
  if (player.balance < betAmount) {
    return interaction.reply({
      content: `No tienes suficientes créditos. Tu balance actual es de ${player.balance} créditos.`,
      ephemeral: true
    });
  }
  
  // Check if there's an active game in this channel
  const channelId = interaction.channelId;
  let game = client.activeGames.get(channelId);
  
  // If no game exists, create one
  if (!game) {
    await interaction.reply(`¡Nueva partida de Ride the Bus iniciada por ${username}!`);
    // Game will be created when player joins
  } else if (game.players.has(userId)) {
    return interaction.reply({
      content: 'Ya estás participando en esta partida.',
      ephemeral: true
    });
  } else {
    await interaction.reply(`${username} quiere unirse a la partida con ${betAmount} créditos.`);
  }
  
  // Deduct bet from player's balance
  player.balance -= betAmount;
  await player.save();
  
  // Store player's bet information temporarily
  if (!client.pendingBets) {
    client.pendingBets = new Map();
  }
  
  client.pendingBets.set(userId, {
    channelId,
    betAmount,
    timestamp: Date.now()
  });
  
  await interaction.followUp({
    content: `Has apostado ${betAmount} créditos. Usa /jugar para unirte a la partida.`,
    ephemeral: true
  });
}