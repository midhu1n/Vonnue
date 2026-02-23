from django.db import models
import uuid

class Decision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query = models.TextField(help_text="The decision query or goal")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.query

class Option(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    decision = models.ForeignKey(Decision, related_name='options', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Criterion(models.Model):
    TYPE_CHOICES = [
        ('benefit', 'Benefit (Higher is better)'),
        ('cost', 'Cost (Lower is better)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    decision = models.ForeignKey(Decision, related_name='criteria', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    weight = models.FloatField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.weight})"

class Score(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    option = models.ForeignKey(Option, related_name='scores', on_delete=models.CASCADE)
    criterion = models.ForeignKey(Criterion, related_name='scores', on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        unique_together = ('option', 'criterion')

    def __str__(self):
        return f"{self.option.title} / {self.criterion.name} = {self.value}"
