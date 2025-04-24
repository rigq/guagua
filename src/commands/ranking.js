import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Player } from '../database/models/Player.js';

export const data = new SlashCommandBuilder()
  .setName('ranking')
  .setDescription('Muestra el ranking de los mejores jugadores');

export async function execute(interaction) {
  try {
    // Get top 10 players by balance
    const topByBalance = await Player.find().sort({ balance: -1 }).limit(10);
    
    // Get top 10 players by highest win
    const topByHighestWin = await Player.find().sort({ highestWin: -1 }).limit(10);
    
    // Create the embed
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🏆 Ranking de Jugadores 🏆')
      .setTimestamp();
    
    // Add top players by balance
    let balanceField = '';
    topByBalance.forEach((player, index) => {
      balanceField += `${index + 1}. **${player.username}**: ${player.balance} créditos\n`;
    });
    embed.addFields({ name: '💰 Los Más Ricos', value: balanceField || 'No hay jugadores todavía.' });
    
    // Add top players by highest win
    let highestWinField = '';
    topByHighestWin.forEach((player, index) => {
      highestWinField += `${index + 1}. **${player.username}**: ${player.highestWin} créditos\n`;
    });
    embed.addFields({ name: '🌟 Mayores Ganancias', value: highestWinField || 'No hay jugadores todavía.' });
    
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'Hubo un error al obtener el ranking.',
      ephemeral: true
    });
  }
}