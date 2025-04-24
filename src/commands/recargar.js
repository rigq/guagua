import { SlashCommandBuilder } from 'discord.js';
import { Player } from '../database/models/Player.js';

export const data = new SlashCommandBuilder()
  .setName('recargar')
  .setDescription('Recarga tu balance si tienes menos de 100 créditos');

export async function execute(interaction) {
  const userId = interaction.user.id;
  const username = interaction.user.username;
  
  try {
    // Find or create the player
    const player = await Player.findOrCreate(userId, username);
    
    // Only allow recharge if player has less than 100 credits
    if (player.balance >= 100) {
      return interaction.reply({
        content: `Todavía tienes ${player.balance} créditos. Solo puedes recargar si tienes menos de 100 créditos.`,
        ephemeral: true
      });
    }
    
    // Give the player 500 credits
    player.balance = 500;
    await player.save();
    
    await interaction.reply(`¡Recarga exitosa! Tu nuevo balance es de 500 créditos.`);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'Hubo un error al recargar tu balance.',
      ephemeral: true
    });
  }
}