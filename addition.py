import random

def additionner_ou_soustraire(a, b):
  """
  Cette fonction effectue aléatoirement une addition ou une soustraction
  entre deux nombres et retourne le résultat.
  """
  if random.choice([True, False]):
    resultat = a + b
    operation = "addition"
  else:
    resultat = a - b
    operation = "soustraction"
  print(f"Opération effectuée : {operation}")
  return resultat 