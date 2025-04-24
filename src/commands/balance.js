import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Player } from '../database/models/Player.js';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Muestra tu balance actual y estadísticas');

export async function execute(interaction) {
  const userId = interaction.user.id;
  const username = interaction.user.username;
  
  try {
    // Find or create the player
    const player = await Player.findOrCreate(userId, username);
    
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle(`💰 Balance de ${username}`)
      .setDescription('Estadísticas de juego en Ride the Bus')
      .addFields(
        { name: 'Balance Actual', value: `${player.balance} créditos`, inline: true },
        { name: 'Partidas Jugadas', value: player.gamesPlayed.toString(), inline: true },
        { name: 'Partidas Ganadas', value: player.gamesWon.toString(), inline: true },
        { name: 'Ganancias Totales', value: `${player.totalWinnings} créditos`, inline: true },
        { name: 'Pérdidas Totales', value: `${player.totalLosses} créditos`, inline: true },
        { name: 'Mayor Ganancia', value: `${player.highestWin} créditos`, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'Hubo un error al obtener tu balance.',
      ephemeral: true
    });
  }
}